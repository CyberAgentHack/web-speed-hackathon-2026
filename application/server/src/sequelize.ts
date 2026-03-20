import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

export async function initializeSequelize() {
  const prevSequelize = _sequelize;
  _sequelize = null;
  await prevSequelize?.close();

  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
    "./database.sqlite",
  );
  await fs.copyFile(DATABASE_PATH, TEMP_PATH);

  const SLOW_QUERY_THRESHOLD_MS = 100;

  _sequelize = new Sequelize({
    benchmark: true,
    dialect: "sqlite",
    logging: (sql: string, timing?: number) => {
      if (timing !== undefined && timing >= SLOW_QUERY_THRESHOLD_MS) {
        console.warn(`[SLOW QUERY] ${timing}ms\n${sql}`);
      }
    },
    storage: TEMP_PATH,
  });
  initModels(_sequelize);
}
