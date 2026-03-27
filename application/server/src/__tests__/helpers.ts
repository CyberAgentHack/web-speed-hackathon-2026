import http from "node:http";

type RequestLikeApp = {
  request(input: string | Request, init?: RequestInit): Response | Promise<Response>;
};

type BunFetchApp = {
  fetch(request: Request | string, init?: RequestInit): Response | Promise<Response>;
};

type ListenableRequestHandler = http.RequestListener & {
  listen?: (...args: unknown[]) => http.Server;
};

export type TestApp = {
  request(input: string | Request, init?: RequestInit): Promise<Response>;
  connectWebSocket(path: string, cookie?: string): WebSocket;
  close?(): Promise<void>;
};

async function getAvailablePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = http.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();
      if (address == null || typeof address === "string") {
        server.close(() => reject(new Error("Failed to reserve a test port")));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error != null) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

export async function createHonoTestApp(
  app: RequestLikeApp & BunFetchApp,
  websocket: unknown,
): Promise<TestApp> {
  const port = await getAvailablePort();
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",
    fetch(req, server) {
      return app.fetch(req, { server } as never);
    },
    websocket: websocket as Bun.WebSocketHandler<unknown>,
  });
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const wsBaseUrl = `ws://127.0.0.1:${server.port}`;

  return {
    async request(input, init) {
      const request = typeof input === "string" ? new Request(new URL(input, baseUrl), init) : input;
      return await fetch(new URL(request.url, baseUrl), init ?? request);
    },
    connectWebSocket(path, cookie) {
      return new WebSocket(new URL(path, wsBaseUrl), {
        headers: cookie ? { Cookie: cookie } : undefined,
      } as unknown as string[]);
    },
    async close() {
      server.stop(true);
    },
  };
}

export async function createNodeHttpTestApp(handler: ListenableRequestHandler): Promise<TestApp> {
  const listen = handler.listen;
  const server =
    typeof listen === "function"
      ? await new Promise<http.Server>((resolve, reject) => {
          const listeningServer = listen.call(handler, 0, "127.0.0.1", () => {
            listeningServer.off("error", reject);
            resolve(listeningServer);
          });
          listeningServer.once("error", reject);
        })
      : await new Promise<http.Server>((resolve, reject) => {
          const listeningServer = http.createServer(handler);
          listeningServer.once("error", reject);
          listeningServer.listen(0, "127.0.0.1", () => {
            listeningServer.off("error", reject);
            resolve(listeningServer);
          });
        });

  const address = server.address();
  if (address == null || typeof address === "string") {
    throw new Error("Failed to start test HTTP server");
  }
  server.unref();

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const wsBaseUrl = `ws://127.0.0.1:${address.port}`;

  return {
    async request(input, init) {
      const request = typeof input === "string" ? new Request(new URL(input, baseUrl), init) : input;
      const url = new URL(request.url, baseUrl);
      if (request.headers.get("upgrade")?.toLowerCase() === "websocket") {
        url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
      }
      return await fetch(url, init ?? request);
    },
    connectWebSocket(path, cookie) {
      const url = new URL(path, wsBaseUrl);
      return new WebSocket(url, {
        headers: cookie ? { Cookie: cookie } : undefined,
      } as unknown as string[]);
    },
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error != null) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

export async function signupAndGetCookie(
  app: TestApp,
  username = "testuser",
  password = "testpass123",
): Promise<{ cookie: string; body: Record<string, unknown> }> {
  const res = await app.request("/api/v1/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, name: username }),
  });
  const cookie = res.headers.get("set-cookie") ?? "";
  const body = (await res.json()) as Record<string, unknown>;
  return { cookie, body };
}

export function requestWithSession(
  app: TestApp,
  method: string,
  path: string,
  cookie: string,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = { Cookie: cookie };
  let reqBody: string | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    reqBody = JSON.stringify(body);
  }
  return app.request(path, { method, headers, body: reqBody });
}

export async function waitForWebSocketOpen(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.OPEN) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("error", onError);
    };
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = (event: Event) => {
      cleanup();
      reject(event);
    };
    socket.addEventListener("open", onOpen, { once: true });
    socket.addEventListener("error", onError, { once: true });
  });
}

export type WebSocketObserver<T = unknown> = {
  socket: WebSocket;
  nextMessage(timeoutMs?: number): Promise<T>;
};

export function observeWebSocket<T = unknown>(socket: WebSocket): WebSocketObserver<T> {
  const queue: T[] = [];
  const waiters: Array<{
    resolve(value: T): void;
    reject(error: unknown): void;
    timeout: ReturnType<typeof setTimeout>;
  }> = [];

  socket.addEventListener("message", (event: MessageEvent<string>) => {
    const parsed = JSON.parse(event.data) as T;
    const waiter = waiters.shift();
    if (waiter) {
      clearTimeout(waiter.timeout);
      waiter.resolve(parsed);
      return;
    }
    queue.push(parsed);
  });

  socket.addEventListener("error", (event: Event) => {
    while (waiters.length > 0) {
      const waiter = waiters.shift();
      if (waiter) {
        clearTimeout(waiter.timeout);
        waiter.reject(event);
      }
    }
  });

  socket.addEventListener("close", () => {
    while (waiters.length > 0) {
      const waiter = waiters.shift();
      if (waiter) {
        clearTimeout(waiter.timeout);
        waiter.reject(new Error("WebSocket closed before a message was received"));
      }
    }
  });

  return {
    socket,
    async nextMessage(timeoutMs = 5_000) {
      const queued = queue.shift();
      if (queued !== undefined) {
        return queued;
      }

      return await new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const index = waiters.findIndex((entry) => entry.resolve === resolve);
          if (index >= 0) {
            waiters.splice(index, 1);
          }
          reject(new Error(`Timed out waiting for WebSocket message after ${timeoutMs}ms`));
        }, timeoutMs);

        waiters.push({ resolve, reject, timeout });
      });
    },
  };
}
