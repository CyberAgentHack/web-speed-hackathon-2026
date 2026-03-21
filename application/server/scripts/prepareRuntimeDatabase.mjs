import * as fs from "node:fs/promises";
import path from "node:path";

const scriptDir = import.meta.dirname;
const serverDir = path.resolve(scriptDir, "..");
const databasePath = path.resolve(serverDir, "database.sqlite");
const runtimeDirPath = path.resolve(serverDir, ".runtime");
const runtimeDatabasePath = path.resolve(runtimeDirPath, "database.sqlite");
const runtimeDirtyMarkerPath = path.resolve(runtimeDirPath, ".dirty");

await fs.mkdir(runtimeDirPath, { recursive: true });
await fs.copyFile(databasePath, runtimeDatabasePath);
await fs.rm(runtimeDirtyMarkerPath, { force: true });
