import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

export async function initializeSequelize() {
  const prevSequelize = _sequelize;

  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
    "./database.sqlite",
  );
  await fs.copyFile(DATABASE_PATH, TEMP_PATH);

  const nextSequelize = new Sequelize({
    dialect: "sqlite",
    logging: false,
    storage: TEMP_PATH,
  });
  initModels(nextSequelize);

  // Enable WAL mode for concurrent read access during benchmark testing
  // This prevents write locks from blocking all read operations
  await nextSequelize.query("PRAGMA journal_mode = WAL");

  // Swap to the new instance before closing the old one
  _sequelize = nextSequelize;

  // Close old connection after models are rebound
  await prevSequelize?.close().catch(() => {});
}
