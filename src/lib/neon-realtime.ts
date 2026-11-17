import { NEON_REALTIME_URL } from './config';

type Listener = (msg: any) => void;
const listeners = new Map<string, Set<Listener>>();
let ws: WebSocket | null = null;

export function getRealtimeSocket(): WebSocket | null {
  if (typeof window === 'undefined' || !NEON_REALTIME_URL) return null;
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    try {
      ws = new WebSocket(NEON_REALTIME_URL);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const topic = data.table || data.channel || 'all';
          listeners.get(topic)?.forEach((fn) => fn(data));
          listeners.get('all')?.forEach((fn) => fn(data));
        } catch {
          // ignore malformed payloads
        }
      };
      ws.onerror = (e) => {
        console.warn('Neon Realtime error:', e);
      };
    } catch (e) {
      console.warn('Failed to connect to Neon Realtime:', e);
    }
  }
  return ws;
}

export function subscribeToRealtime(topic: string, callback: Listener) {
  if (!listeners.has(topic)) listeners.set(topic, new Set());
  listeners.get(topic)!.add(callback);
  getRealtimeSocket();
  return () => {
    listeners.get(topic)?.delete(callback);
  };
}
