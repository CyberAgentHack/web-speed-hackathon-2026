import { beforeAll } from "bun:test";

import { initializeDb } from "../db";

beforeAll(async () => {
  await initializeDb();
});
