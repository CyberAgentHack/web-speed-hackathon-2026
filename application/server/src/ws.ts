import { createNodeWebSocket } from "@hono/node-ws";
import type { Context, MiddlewareHandler } from "hono";
import type { WSEvents } from "hono/ws";

import type { AppEnv } from "./types.js";

type NodeWebSocket = ReturnType<typeof createNodeWebSocket>;

let _upgradeWebSocket: NodeWebSocket["upgradeWebSocket"] | null = null;
let _injectWebSocket: NodeWebSocket["injectWebSocket"] | null = null;

export function initWebSocket(app: Parameters<typeof createNodeWebSocket>[0]["app"]) {
  const ws = createNodeWebSocket({ app });
  _upgradeWebSocket = ws.upgradeWebSocket;
  _injectWebSocket = ws.injectWebSocket;
}

export function upgradeWebSocket(
  createEvents: (c: Context<AppEnv>) => WSEvents | Promise<WSEvents>,
): MiddlewareHandler<AppEnv> {
  return (c, next) => {
    if (!_upgradeWebSocket) return next();
    return (_upgradeWebSocket as (fn: typeof createEvents) => MiddlewareHandler<AppEnv>)(createEvents)(c, next);
  };
}

export function injectWebSocket(server: Parameters<NodeWebSocket["injectWebSocket"]>[0]) {
  _injectWebSocket?.(server);
}
