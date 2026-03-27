import { afterEach, beforeAll } from "bun:test";

import { initializeSequelize } from "@web-speed-hackathon-2026/server/src/sequelize";
import { clearSessions } from "./session_utils";

const globalForTests = globalThis as typeof globalThis & {
  __serverTestDbInitPromise__?: Promise<void>;
};

export async function resetTestState() {
  await initializeSequelize();
  await clearSessions();
}

export function setupApiTestFile() {
  beforeAll(async () => {
    globalForTests.__serverTestDbInitPromise__ ??= Promise.resolve();
    await globalForTests.__serverTestDbInitPromise__;
    const nextInit = resetTestState();
    globalForTests.__serverTestDbInitPromise__ = nextInit;
    await nextInit;
  });

  afterEach(async () => {
    await clearSessions();
  });
}
