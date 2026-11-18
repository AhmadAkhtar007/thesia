# Production & Local Setup Guide

This guide walks through configuring the live backend for **Thesia** using the **Neon Serverless Stack** (Postgres, Neon Auth, Realtime, and AI Gateway).

---

## 1. Prerequisites
- **Node.js**: v20 or higher
- **Neon CLI**: `npm i -g neon@latest`

---

## 2. Neon Backend Setup

1. **Sign in to Neon:**
   ```bash
   neon login
   ```
2. **Link and Provision Services:**
   In the project root, run:
   ```bash
   neon init -y --branch production --services postgres,auth,ai-gateway,realtime
   neon deploy
   ```
   This provisions the database, authentication endpoints, and websocket infrastructure on your branch, and automatically pulls your credentials into `.env.local`.

3. **Apply Database Schema & Seed Data:**
   Run the migration script to create all tables, indexes, RLS policies, and catalog seed data:
   ```bash
   node scripts/migrate-neon.mjs
   ```

4. **Verify Database:**
   To test table health and verify administrator records:
   ```bash
   node scripts/migrate-neon.mjs
   ```

---

## 3. Environment Variables

The application reads from `.env.local` (local development) or platform environment variables (Vercel). See [`.env.example`](../.env.example) for the full list of variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string (for queries & transactions) |
| `DATABASE_URL_UNPOOLED` | Direct Postgres connection string (for schema migrations) |
| `NEON_AUTH_BASE_URL` | Neon Auth endpoint (Managed Better Auth) |
| `NEON_AUTH_JWKS_URL` | Public JWKS URL for JWT verification |
| `NEON_REALTIME_URL` | WebSocket URL for live updates |
| `THESIA_SITE_URL` | Canonical application URL |

---

## 4. Running the Application

- **Development Server:**
  ```bash
  npm run dev        # Starts local server at http://localhost:5173
  ```
- **Production Build:**
  ```bash
  npm run build      # Compiles to dist/ with prerendered SEO pages
  ```
- **Type Checking:**
  ```bash
  npm run typecheck  # Verifies TypeScript types with tsc --noEmit
  ```
