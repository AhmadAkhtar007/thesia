import { neon } from '@neondatabase/serverless';
import { NEON_DATABASE_URL } from './config';

const sql = NEON_DATABASE_URL ? neon(NEON_DATABASE_URL) : null;

export function parsePostgrest(queryStr = '') {
  const parts = queryStr.split('&').filter(Boolean);
  let select = '*';
  const where: string[] = [];
  let order = '';
  let limit = '';

  for (const p of parts) {
    const eqIdx = p.indexOf('=');
    if (eqIdx === -1) continue;
    const k = p.slice(0, eqIdx);
    const v = p.slice(eqIdx + 1);

    if (k === 'select') {
      select = v;
    } else if (k === 'order') {
      const orderItems = v.split(',').map((item) => {
        const [col, dir] = item.split('.');
        return `"${col}" ${dir ? dir.toUpperCase() : 'ASC'}`;
      });
      order = `ORDER BY ${orderItems.join(', ')}`;
    } else if (k === 'limit') {
      limit = `LIMIT ${parseInt(v, 10)}`;
    } else if (v) {
      if (v.startsWith('eq.')) {
        const val = decodeURIComponent(v.slice(3));
        where.push(`"${k}" = '${val.replace(/'/g, "''")}'`);
      } else if (v === 'is.true') {
        where.push(`"${k}" IS TRUE`);
      } else if (v === 'is.false') {
        where.push(`"${k}" IS FALSE`);
      } else if (v === 'is.null') {
        where.push(`"${k}" IS NULL`);
      }
    }
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { select, whereClause, order, limit };
}

export const neonDb = {
  async select<T = any>(table: string, query = 'select=*'): Promise<T[]> {
    if (!sql) return [];
    const { select: cols, whereClause, order, limit } = parsePostgrest(query);
    const q = `SELECT ${cols} FROM public."${table}" ${whereClause} ${order} ${limit};`;
    return (await sql.query(q)) as T[];
  },

  async one<T = any>(table: string, query: string): Promise<T | null> {
    const rows = await this.select<T>(table, `${query}&limit=1`);
    return rows[0] ?? null;
  },

  async insert<T = any>(table: string, row: object | object[]): Promise<T[]> {
    if (!sql) return [];
    const rows = Array.isArray(row) ? row : [row];
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    const cols = keys.map((k) => `"${k}"`).join(', ');

    const valueRows = rows.map((r: any) => {
      const vals = keys.map((k) => {
        const val = r[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return `(${vals.join(', ')})`;
    });

    const q = `INSERT INTO public."${table}" (${cols}) VALUES ${valueRows.join(', ')} RETURNING *;`;
    return (await sql.query(q)) as T[];
  },

  async insertQuiet(table: string, row: object | object[]): Promise<void> {
    await this.insert(table, row);
  },

  async upsert<T = any>(table: string, row: object | object[], onConflict?: string): Promise<T[]> {
    if (!sql) return [];
    const rows = Array.isArray(row) ? row : [row];
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    const cols = keys.map((k) => `"${k}"`).join(', ');

    const valueRows = rows.map((r: any) => {
      const vals = keys.map((k) => {
        const val = r[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return `(${vals.join(', ')})`;
    });

    const conflictClause = onConflict
      ? `ON CONFLICT (${onConflict}) DO UPDATE SET ${keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(', ')}`
      : 'ON CONFLICT DO NOTHING';

    const q = `INSERT INTO public."${table}" (${cols}) VALUES ${valueRows.join(', ')} ${conflictClause} RETURNING *;`;
    return (await sql.query(q)) as T[];
  },

  async update<T = any>(table: string, filter: string, patch: object): Promise<T[]> {
    if (!sql) return [];
    const { whereClause } = parsePostgrest(filter);
    const sets = Object.entries(patch).map(([k, val]) => {
      if (val === null || val === undefined) return `"${k}" = NULL`;
      if (typeof val === 'number' || typeof val === 'boolean') return `"${k}" = ${val}`;
      if (typeof val === 'object') return `"${k}" = '${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
      return `"${k}" = '${String(val).replace(/'/g, "''")}'`;
    });

    const q = `UPDATE public."${table}" SET ${sets.join(', ')} ${whereClause} RETURNING *;`;
    return (await sql.query(q)) as T[];
  },

  async remove(table: string, filter: string) {
    if (!sql) return;
    const { whereClause } = parsePostgrest(filter);
    const q = `DELETE FROM public."${table}" ${whereClause};`;
    return await sql.query(q);
  },

  async rpc<T = any>(fn: string, args: Record<string, any> = {}): Promise<T> {
    if (!sql) return null as any;
    const keys = Object.keys(args);
    if (!keys.length) {
      const rows = (await sql.query(`SELECT public.${fn}() as result;`)) as any[];
      return rows[0]?.result;
    }
    const paramNames = keys
      .map((k) => {
        const val = args[k];
        if (Array.isArray(val)) return `${k} => ARRAY[${val.map((x) => `'${String(x).replace(/'/g, "''")}'`).join(', ')}]`;
        return `${k} => '${String(val).replace(/'/g, "''")}'`;
      })
      .join(', ');
    const rows = (await sql.query(`SELECT public.${fn}(${paramNames}) as result;`)) as any[];
    return rows[0]?.result;
  },
};
