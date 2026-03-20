import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { v4 as uuidv4 } from "uuid";

type SessionData = { userId: string };

export const sessionStore = new Map<string, SessionData>();

type Session = {
  get: () => SessionData | undefined;
  set: (data: SessionData) => void;
  delete: () => void;
};

export type SessionEnv = {
  Variables: {
    session: Session;
  };
};

export const sessionMiddleware = createMiddleware<SessionEnv>(async (c, next) => {
  let sid = getCookie(c, "sid");
  if (!sid) {
    sid = uuidv4();
    setCookie(c, "sid", sid, { httpOnly: true, path: "/" });
  }

  c.set("session", {
    get: () => sessionStore.get(sid),
    set: (data: SessionData) => {
      sessionStore.set(sid, data);
    },
    delete: () => {
      sessionStore.delete(sid);
      deleteCookie(c, "sid");
    },
  });

  await next();
});
