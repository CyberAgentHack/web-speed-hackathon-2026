import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { QueryTypes, Sequelize } from "sequelize";

import {
  initModels,
  ProfileImage,
} from "@web-speed-hackathon-2026/server/src/models";
import {
  DATABASE_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

const IMAGE_EXTENSIONS = ["webp", "jpg", "jpeg", "png", "gif", "avif"];

async function ensureDmIndexes(sequelize: Sequelize) {
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created_at
    ON DirectMessages(conversationId, createdAt)
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_sender_is_read
    ON DirectMessages(conversationId, senderId, isRead)
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_dm_conversations_initiator_id
    ON DirectMessageConversations(initiatorId)
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_dm_conversations_member_id
    ON DirectMessageConversations(memberId)
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_dm_conversations_pair
    ON DirectMessageConversations(initiatorId, memberId)
  `);
}

async function resolveImageFilePath(
  filePathWithoutExtension: string,
): Promise<string | null> {
  for (const extension of IMAGE_EXTENSIONS) {
    const filePath = `${filePathWithoutExtension}.${extension}`;
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      continue;
    }
  }
  return null;
}

async function getAverageColorRgbFromFile(
  filePathWithoutExtension: string,
): Promise<string | null> {
  const filePath = await resolveImageFilePath(filePathWithoutExtension);
  if (filePath == null) {
    return null;
  }

  const sharp = (await import("sharp")).default;
  const stats = await sharp(filePath).stats();
  const [red, green, blue] = stats.channels
    .slice(0, 3)
    .map(({ mean }) => Math.round(mean));
  return `rgb(${red}, ${green}, ${blue})`;
}

async function ensureProfileImageAverageColors(sequelize: Sequelize) {
  const columns = await sequelize.query<{ name: string }>(
    "PRAGMA table_info('ProfileImages')",
    { type: QueryTypes.SELECT },
  );
  const hasAverageColor = columns.some((column) =>
    column.name === "averageColor"
  );

  if (!hasAverageColor) {
    await sequelize.query(
      "ALTER TABLE ProfileImages ADD COLUMN averageColor TEXT",
    );
  }

  const missingRows = await sequelize.query<{ id: string }>(
    "SELECT id FROM ProfileImages WHERE averageColor IS NULL OR averageColor = ''",
    { type: QueryTypes.SELECT },
  );

  if (missingRows.length === 0) {
    return;
  }

  await Promise.all(
    missingRows.map(async ({ id }) => {
      const uploadBasePath = path.resolve(UPLOAD_PATH, `images/profiles/${id}`);
      const publicBasePath = path.resolve(PUBLIC_PATH, `images/profiles/${id}`);
      const averageColor = (await getAverageColorRgbFromFile(uploadBasePath)) ??
        (await getAverageColorRgbFromFile(publicBasePath));

      if (averageColor != null) {
        await ProfileImage.update({ averageColor }, { where: { id } });
      }
    }),
  );
}

export async function initializeSequelize() {
  const prevSequelize = _sequelize;
  _sequelize = null;
  await prevSequelize?.close();

  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
    "./database.sqlite",
  );
  await fs.copyFile(DATABASE_PATH, TEMP_PATH);

  _sequelize = new Sequelize({
    dialect: "sqlite",
    logging: false,
    storage: TEMP_PATH,
  });
  initModels(_sequelize);
  await ensureProfileImageAverageColors(_sequelize);
  await ensureDmIndexes(_sequelize);
}
