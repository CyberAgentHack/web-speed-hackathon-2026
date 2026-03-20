import * as fs from "node:fs/promises";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { insertSeeds } from "@web-speed-hackathon-2026/server/src/seeds";

await fs.rm(DATABASE_PATH, { force: true, recursive: true });
const sequelize = new Sequelize({
  dialect: "sqlite",
  logging: false,
  storage: DATABASE_PATH,
});
initModels(sequelize);
await sequelize.sync({ force: true, logging: false });
await insertSeeds(sequelize);
