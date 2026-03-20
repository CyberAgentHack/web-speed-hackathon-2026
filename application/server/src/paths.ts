import path from "path";

const __dirname = import.meta.dirname;

export const PUBLIC_PATH = path.resolve(__dirname, "../../public");
export const UPLOAD_PATH = path.resolve(__dirname, "../../upload");
export const CLIENT_DIST_PATH = path.resolve(__dirname, "../../dist");
export const TERMS_HTML_PATH = path.resolve(CLIENT_DIST_PATH, "terms.html");
export const DATABASE_PATH = path.resolve(__dirname, "../database.sqlite");
