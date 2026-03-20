import fs from "node:fs/promises";

import { Router } from "express";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { User } from "@web-speed-hackathon-2026/server/src/models";

import { initializeSequelize } from "../../sequelize";
import { sessionStore } from "../../session";

export const initializeRouter = Router();

const SCORING_USER = {
  id: "a765b706-b228-48ad-bb9b-5534a1667646",
  username: "o6yq16leo",
  name: "和田 正",
  description: "あまる 胃 差し上げる やすい ふゆかい ざせき.",
  password: "wsh-2026",
  profileImageId: "09d52cbb-28a2-4413-b220-1f8c9e80a440",
  createdAt: new Date("2026-01-25T03:13:53.812Z"),
};

initializeRouter.post("/initialize", async (_req, res) => {
  // DBリセット
  await initializeSequelize();
  const scoringUser = await User.unscoped().findOne({
    where: {
      username: SCORING_USER.username,
    },
  });
  if (scoringUser === null) {
    await User.create(SCORING_USER);
  } else if (!scoringUser.validPassword(SCORING_USER.password)) {
    scoringUser.set({
      password: SCORING_USER.password,
    });
    await scoringUser.save();
  }
  // sessionStoreをクリア
  sessionStore.clear();
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  return res.status(200).type("application/json").send({});
});
