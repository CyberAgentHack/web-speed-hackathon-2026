import { HTTPException } from "hono/http-exception";

export function badRequest(message = "Bad Request"): never {
  throw new HTTPException(400, { message });
}

export function unauthorized(message = "Unauthorized"): never {
  throw new HTTPException(401, { message });
}

export function notFound(message = "Not Found"): never {
  throw new HTTPException(404, { message });
}
