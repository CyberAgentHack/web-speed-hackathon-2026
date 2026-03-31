import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { insertSeeds } from "@web-speed-hackathon-2026/server/src/seeds";

const sequelize = new Sequelize(
  process.env["NS_MARIADB_DATABASE"] || "web_speed_hackathon",
  process.env["NS_MARIADB_USER"] || "root",
  process.env["NS_MARIADB_PASSWORD"] || "",
  {
    host: process.env["NS_MARIADB_HOSTNAME"] || "127.0.0.1",
    port: Number(process.env["NS_MARIADB_PORT"]) || 3306,
    dialect: "mariadb",
    logging: false,
  }
);
initModels(sequelize);
await sequelize.sync({ force: true, logging: false });
await insertSeeds(sequelize);
