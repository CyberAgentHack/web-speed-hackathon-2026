import fs from "node:fs";
import path from "path";

const currentDir = import.meta.dirname;
const serverRootCandidates = [path.resolve(currentDir, ".."), path.resolve(currentDir, "../..")];

const SERVER_ROOT =
  serverRootCandidates.find((candidate) => fs.existsSync(path.join(candidate, "package.json"))) ??
  path.resolve(currentDir, "..");
const PROJECT_ROOT = path.resolve(SERVER_ROOT, "..");

export const PUBLIC_PATH = path.resolve(PROJECT_ROOT, "public");
export const UPLOAD_PATH = path.resolve(SERVER_ROOT, "upload");
export const CLIENT_DIST_PATH = path.resolve(PROJECT_ROOT, "dist");
export const DATABASE_PATH = path.resolve(SERVER_ROOT, "database.sqlite");
