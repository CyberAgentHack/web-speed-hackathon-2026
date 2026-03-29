import { constants as fsConstants } from "node:fs";
import * as fs from "node:fs/promises";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import {
  DATABASE_PATH,
  RUNTIME_DATABASE_DIR_PATH,
  RUNTIME_DATABASE_DIRTY_MARKER_PATH,
  RUNTIME_DATABASE_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;
let _databaseDirty: boolean | null = null;

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copySeedDatabaseToRuntime() {
  await fs.mkdir(RUNTIME_DATABASE_DIR_PATH, { recursive: true });
  await fs.copyFile(DATABASE_PATH, RUNTIME_DATABASE_PATH, fsConstants.COPYFILE_FICLONE);
  await fs.rm(RUNTIME_DATABASE_DIRTY_MARKER_PATH, { force: true });
  _databaseDirty = false;
}

export async function isDatabaseDirty() {
  if (_databaseDirty !== null) {
    return _databaseDirty;
  }

  _databaseDirty = await pathExists(RUNTIME_DATABASE_DIRTY_MARKER_PATH);
  return _databaseDirty;
}

export async function markDatabaseDirty() {
  if ((await isDatabaseDirty()) === true) {
    return;
  }

  await fs.mkdir(RUNTIME_DATABASE_DIR_PATH, { recursive: true });
  await fs.writeFile(RUNTIME_DATABASE_DIRTY_MARKER_PATH, "");
  _databaseDirty = true;
}

export async function initializeSequelize({
  resetDatabase = false,
}: { resetDatabase?: boolean } = {}) {
  const prevSequelize = _sequelize;
  _sequelize = null;
  await prevSequelize?.close();

  const runtimeDatabaseExists = await pathExists(RUNTIME_DATABASE_PATH);
  if (
    resetDatabase === true ||
    runtimeDatabaseExists === false ||
    (await isDatabaseDirty()) === true
  ) {
    await copySeedDatabaseToRuntime();
  }

  _sequelize = new Sequelize({
    dialect: "sqlite",
    logging: false,
    storage: RUNTIME_DATABASE_PATH,
  });
  initModels(_sequelize);
}
