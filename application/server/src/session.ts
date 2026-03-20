import session, { MemoryStore } from "express-session";

export const sessionStore = new MemoryStore();

export const sessionMiddleware = session({
  store: sessionStore,
  proxy: true,
  resave: false,
  saveUninitialized: false,
  secret: "secret",
});
