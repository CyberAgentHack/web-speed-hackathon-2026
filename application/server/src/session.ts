import type { Context } from "hono";
import { getCookie } from "hono/cookie";

class MemoryStore {
  private store: Map<string, Record<string, unknown>> = new Map();

  set(id: string, sess: Record<string, unknown>, callback?: (err?: Error) => void) {
    this.store.set(id, sess);
    callback?.();
  }

  get(id: string, callback: (err: Error | null, sess?: Record<string, unknown> | null) => void) {
    const sess = this.store.get(id);
    callback(null, sess || null);
  }

  destroy(id: string, callback?: (err?: Error) => void) {
    this.store.delete(id);
    callback?.();
  }

  clear(callback?: (err?: Error) => void) {
    this.store.clear();
    callback?.();
  }

  all(callback: (err: Error | null, sessions?: Record<string, unknown>) => void) {
    const sessions: Record<string, unknown> = {};
    this.store.forEach((value, key) => {
      sessions[key] = value;
    });
    callback(null, sessions);
  }
}

export const sessionStore = new MemoryStore();

export const createSessionMiddleware = () => {
  return async (c: Context, next: () => Promise<void>) => {
    const sessionId = getCookie(c, "session_id");

    if (!sessionId) {
      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      c.set("session" as never, {} as never);
      c.set("session_id" as never, newSessionId as never);
    } else {
      const session = new Promise<Record<string, unknown> | null>((resolve) => {
        sessionStore.get(sessionId, (_err, sess) => {
          resolve(sess || null);
        });
      });
      const sess = await session;
      c.set("session" as never, (sess || {}) as never);
      c.set("session_id" as never, sessionId as never);
    }

    await next();

    const sessionId_new = c.get("session_id" as never);
    const session_new = c.get("session" as never);

    if (session_new && Object.keys(session_new).length > 0) {
      await new Promise<void>((resolve) => {
        sessionStore.set(sessionId_new, session_new, () => resolve());
      });
    }
  };
};
