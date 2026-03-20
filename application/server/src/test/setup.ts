import { beforeAll } from "vitest";

import { initializeSequelize } from "../sequelize";

beforeAll(async () => {
  await initializeSequelize();
});
