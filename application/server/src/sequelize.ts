import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import * as zlib from "node:zlib";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_GZ_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;
let _currentTempDir: string | null = null;

export async function initializeSequelize() {
  const prevSequelize = _sequelize;
  const oldTempDir = _currentTempDir;

  const tempDir = await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-"));
  const TEMP_PATH = path.resolve(tempDir, "./database.sqlite");
  const compressed = await fs.readFile(DATABASE_GZ_PATH);
  const decompressed = zlib.gunzipSync(compressed);
  await fs.writeFile(TEMP_PATH, decompressed);

  const dev = process.env["NODE_ENV"] === "development";
  if (dev) console.log("dev: db");

  const newSequelize = new Sequelize({
    dialect: "sqlite",
    storage: TEMP_PATH,
    logging: dev ? console.log : false,
  });
  initModels(newSequelize);
  _sequelize = newSequelize;
  _currentTempDir = tempDir;

  await prevSequelize?.close();

  // 古い temp ディレクトリを削除
  if (oldTempDir) {
    await fs.rm(oldTempDir, { recursive: true, force: true }).catch(() => {});
  }
}
