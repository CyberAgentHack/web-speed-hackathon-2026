declare module "hono" {
  interface ContextVariableMap {
    body: Record<string, unknown>;
    rawBody: Buffer;
    session: Record<string, unknown>;
    session_id: string;
  }
}

export {};
