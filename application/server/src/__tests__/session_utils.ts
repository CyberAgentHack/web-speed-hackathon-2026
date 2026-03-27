import * as sessionModule from "@web-speed-hackathon-2026/server/src/session";

type SessionMap = Map<string, unknown>;

type SessionStoreLike = {
  clear(callback: (error?: unknown) => void): void;
  set(id: string, session: string, callback: (error?: unknown) => void): void;
  sessions: Record<string, string>;
};

function getSessionMap(): SessionMap | null {
  const value = (sessionModule as { sessions?: unknown }).sessions;
  return value instanceof Map ? value : null;
}

function getSessionStore(): SessionStoreLike | null {
  const value = (sessionModule as { sessionStore?: unknown }).sessionStore;
  if (
    value != null &&
    typeof value === "object" &&
    "clear" in value &&
    "set" in value &&
    "sessions" in value
  ) {
    return value as SessionStoreLike;
  }
  return null;
}

export async function clearSessions() {
  const sessions = getSessionMap();
  if (sessions != null) {
    sessions.clear();
    return;
  }

  const sessionStore = getSessionStore();
  if (sessionStore != null) {
    await new Promise<void>((resolve, reject) => {
      sessionStore.clear((error) => {
        if (error != null) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    return;
  }

  throw new Error("No supported session backend export found");
}

export async function writeSession(id: string, userId: string) {
  const sessions = getSessionMap();
  if (sessions != null) {
    sessions.set(id, { userId });
    return;
  }

  const sessionStore = getSessionStore();
  if (sessionStore != null) {
    await new Promise<void>((resolve, reject) => {
      sessionStore.set(id, JSON.stringify({ cookie: {}, userId }), (error) => {
        if (error != null) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    return;
  }

  throw new Error("No supported session backend export found");
}

export function sessionCount() {
  const sessions = getSessionMap();
  if (sessions != null) {
    return sessions.size;
  }

  const sessionStore = getSessionStore();
  if (sessionStore != null) {
    return Object.keys(sessionStore.sessions).length;
  }

  throw new Error("No supported session backend export found");
}
