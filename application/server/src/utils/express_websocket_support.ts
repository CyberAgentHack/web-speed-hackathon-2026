import http from "node:http";

import Express, { Router } from "express";
import { WebSocketServer } from "ws";

function withWsSuffix(path: string): string {
  try {
    const url = new URL(path, "http://localhost");
    url.pathname = `${url.pathname}/ws`;
    return url.pathname + (url.search || "");
  } catch {
    return `${path}/ws`;
  }
}

// @ts-expect-error
Router.prototype.ws = Express.application.ws = function (
  this: Router,
  path: string,
  ...handlers: Express.RequestHandler[]
) {
  this.get(withWsSuffix(path), ...handlers);
};

const listen = Express.application.listen;
Express.application.listen = function (this: Express.Application, ...args: unknown[]) {
  const server = listen.apply(this, args as Parameters<typeof listen>);

  type WsPath = string;
  const mapping = new Map<WsPath, WebSocketServer>();

  server.on("upgrade", (rawReq, socket, head) => {
    const req: Express.Request = Object.setPrototypeOf(rawReq, Express.request);

    req.url = withWsSuffix(req.url);

    const wss = mapping.get(req.path) ?? new WebSocketServer({ noServer: true });
    mapping.set(req.path, wss);

    wss.handleUpgrade(rawReq, socket, head, (ws) => {
      req.ws = ws;

      const dummy = new http.ServerResponse(req);
      dummy.writeHead = function writeHead(statusCode: number) {
        if (statusCode > 200) {
          // @ts-expect-error
          dummy._header = "";
          ws.close();
        }
        return dummy;
      };

      const notfound = () => {
        ws.close();
        if (wss.clients.size === 0) {
          wss.close();
          mapping.delete(req.path);
        }
      };

      // @ts-expect-error
      this.handle(req, dummy, notfound);
    });
  });

  return server;
};
