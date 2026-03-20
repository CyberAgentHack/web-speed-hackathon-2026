import { promises as fs } from "node:fs";
import path from "node:path";

import { Router } from "express";
import exifr from "exifr";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import {
  Post,
  ProfileImage,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const userRouter = Router();

const PROFILE_IMAGE_EXTENSION = "webp";

async function getAverageColorRgb(imageBuffer: Buffer): Promise<string> {
  const stats = await sharp(imageBuffer).stats();
  const [red, green, blue] = stats.channels
    .slice(0, 3)
    .map(({ mean }) => Math.round(mean));
  return `rgb(${red}, ${green}, ${blue})`;
}

userRouter.get("/me", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  const user = await User.findByPk(req.session.userId);

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.put("/me", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  const user = await User.findByPk(req.session.userId);

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  Object.assign(user, req.body);
  await user.save();

  return res.status(200).type("application/json").send(user);
});

userRouter.post("/me/profile-image", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const user = await User.findByPk(req.session.userId);
  if (user === null) {
    throw new httpErrors.NotFound();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("image/") !== true) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const metadata = await sharp(req.body).metadata();
  if (metadata.width == null || metadata.height == null) {
    throw new httpErrors.BadRequest("Invalid image metadata");
  }

  const exif = await exifr.parse(req.body, true);
  const altRaw = exif?.ImageDescription;
  const alt = typeof altRaw === "string" ? altRaw : "";

  const convertedImage = await sharp(req.body)
    .resize({ fit: "cover", height: 128, width: 128 })
    .webp({ quality: 70 })
    .withMetadata()
    .toBuffer();

  const imageId = uuidv4();
  const averageColor = await getAverageColorRgb(convertedImage);

  await fs.mkdir(path.resolve(UPLOAD_PATH, "images/profiles"), {
    recursive: true,
  });
  await fs.writeFile(
    path.resolve(
      UPLOAD_PATH,
      `images/profiles/${imageId}.${PROFILE_IMAGE_EXTENSION}`,
    ),
    convertedImage,
  );

  await ProfileImage.create({
    alt,
    averageColor,
    id: imageId,
  });

  user.profileImageId = imageId;
  await user.save();
  await user.reload();

  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username", async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.params.username,
    },
  });

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(user);
});

userRouter.get("/users/:username/posts", async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.params.username,
    },
  });

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null
      ? Number(req.query["offset"])
      : undefined,
    where: {
      userId: user.id,
    },
  });

  return res.status(200).type("application/json").send(posts);
});
