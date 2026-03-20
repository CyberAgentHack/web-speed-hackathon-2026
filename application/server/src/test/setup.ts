import { beforeAll } from "vitest";

import { initializeDb } from "../db";

beforeAll(async () => {
  await initializeDb();
});
