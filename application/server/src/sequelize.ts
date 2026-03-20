import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels, Sound } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { getSoundWaveform } from "@web-speed-hackathon-2026/server/src/utils/sound_waveform";

let _sequelize: Sequelize | null = null;

async function createRuntimeIndexes(sequelize: Sequelize) {
  await sequelize.query(
    "CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created_at ON DirectMessages (conversationId, createdAt DESC)",
  );
  await sequelize.query(
    "CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_is_read_sender ON DirectMessages (conversationId, isRead, senderId)",
  );
  await sequelize.query(
    "CREATE INDEX IF NOT EXISTS idx_dm_conversations_initiator_id ON DirectMessageConversations (initiatorId)",
  );
  await sequelize.query(
    "CREATE INDEX IF NOT EXISTS idx_dm_conversations_member_id ON DirectMessageConversations (memberId)",
  );
}

async function ensureSoundWaveformColumn(sequelize: Sequelize) {
  const columns = (await sequelize.query("PRAGMA table_info('Sounds')", {
    type: "SELECT",
  })) as Array<{ name?: string }>;

  if (columns.some((column) => column.name === "waveform")) {
    return;
  }

  await sequelize.query("ALTER TABLE Sounds ADD COLUMN waveform TEXT NOT NULL DEFAULT '[]'");
}

async function backfillSoundWaveforms() {
  const sounds = await Sound.findAll({
    attributes: ["id", "waveform"],
  });

  for (const sound of sounds) {
    const waveform = sound.get("waveform") as unknown;
    if (Array.isArray(waveform) && waveform.length > 0) {
      continue;
    }

    try {
      sound.waveform = JSON.stringify(await getSoundWaveform(sound.id));
      await sound.save({ fields: ["waveform"] });
    } catch {
      continue;
    }
  }
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
  await ensureSoundWaveformColumn(_sequelize);
  await backfillSoundWaveforms();
  await createRuntimeIndexes(_sequelize);
}

export function getSequelize() {
  if (_sequelize == null) {
    throw new Error("Sequelize is not initialized");
  }

  return _sequelize;
}
