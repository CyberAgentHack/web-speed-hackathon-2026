import path from "path";

const __dirname = import.meta.dirname;

export const PUBLIC_PATH = path.resolve(__dirname, "../../public");
export const UPLOAD_PATH = path.resolve(__dirname, "../../upload");
export const CLIENT_DIST_PATH = path.resolve(__dirname, "../../dist");
export const DATABASE_PATH = path.resolve(__dirname, "../database.sqlite");
export const RUNTIME_DATABASE_DIR_PATH = path.resolve(__dirname, "../.runtime");
export const RUNTIME_DATABASE_PATH = path.resolve(RUNTIME_DATABASE_DIR_PATH, "database.sqlite");
export const RUNTIME_DATABASE_DIRTY_MARKER_PATH = path.resolve(RUNTIME_DATABASE_DIR_PATH, ".dirty");
