import WebSocket from "ws";

declare module "express-session" {
  interface SessionData {
    userId?: string | undefined;
  }
}

declare module "express" {
  function Router(options?: RouterOptions): Router;
  interface Router {
    ws: IRouterMatcher<this>;
  }
}

declare global {
  namespace Express {
    interface Request {
      _wsHandled: boolean;
      ws: WebSocket;
    }
    interface Application {
      ws: import("express").IRouterMatcher<this>;
    }
  }
}

declare module "negaposi-analyzer-ja";
