import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.resolve(__dirname, "../../dist");
const SEEDS_PATH = path.resolve(__dirname, "../../server/seeds");

function readJsonl<T>(filename: string): T[] {
  const filePath = path.join(SEEDS_PATH, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return content
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as T);
}

interface SeedPost {
  id: string;
  userId: string;
  text: string;
  movieId: string | null;
  soundId: string | null;
  createdAt: string;
}
interface SeedUser {
  id: string;
  username: string;
  name: string;
  description: string;
  profileImageId: string;
  createdAt: string;
}
interface SeedProfileImage {
  id: string;
  alt: string;
}
interface SeedImage {
  id: string;
  alt: string;
  createdAt: string;
}
interface SeedMovie {
  id: string;
}
interface SeedSound {
  id: string;
  title: string;
  artist: string;
}
interface SeedPostImageRelation {
  postId: string;
  imageId: string;
}

function buildTimelineData(limit: number): Models.Post[] {
  const posts = readJsonl<SeedPost>("posts.jsonl");
  const users = readJsonl<SeedUser>("users.jsonl");
  const profileImages = readJsonl<SeedProfileImage>("profileImages.jsonl");
  const images = readJsonl<SeedImage>("images.jsonl");
  const movies = readJsonl<SeedMovie>("movies.jsonl");
  const sounds = readJsonl<SeedSound>("sounds.jsonl");
  const postImageRelations = readJsonl<SeedPostImageRelation>("postsImagesRelation.jsonl");

  const userMap = new Map(users.map((u) => [u.id, u]));
  const profileImageMap = new Map(profileImages.map((p) => [p.id, p]));
  const imageMap = new Map(images.map((i) => [i.id, i]));
  const movieMap = new Map(movies.map((m) => [m.id, m]));
  const soundMap = new Map(sounds.map((s) => [s.id, s]));

  const postImagesMap = new Map<string, string[]>();
  for (const rel of postImageRelations) {
    const existing = postImagesMap.get(rel.postId) ?? [];
    existing.push(rel.imageId);
    postImagesMap.set(rel.postId, existing);
  }

  const sortedPosts = [...posts].sort((a, b) => (a.id < b.id ? 1 : -1));
  const topPosts = sortedPosts.slice(0, limit);

  return topPosts.map((post) => {
    const user = userMap.get(post.userId)!;
    const profileImage = profileImageMap.get(user.profileImageId)!;
    const imageIds = postImagesMap.get(post.id) ?? [];
    const postImages = imageIds
      .map((id) => imageMap.get(id)!)
      .filter(Boolean)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

    return {
      id: post.id,
      text: post.text,
      createdAt: post.createdAt,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        description: user.description,
        createdAt: user.createdAt,
        profileImage: { id: profileImage.id, alt: profileImage.alt },
      },
      images: postImages.map((img) => ({ id: img.id, alt: img.alt, createdAt: img.createdAt })),
      movie: post.movieId !== null ? (movieMap.get(post.movieId) ?? null) : null,
      sound: post.soundId !== null ? (soundMap.get(post.soundId) ?? null) : null,
    } as Models.Post;
  });
}

interface SsgPage {
  urlPath: string;
  outputFile: string;
  title: string;
  initialData?: { apiPath: string; data: unknown[] };
}

function buildSsgPages(): SsgPage[] {
  const timelineData = buildTimelineData(3);
  return [
    { urlPath: "/terms", outputFile: "terms.html", title: "利用規約 - CaX" },
    {
      urlPath: "/",
      outputFile: "home.html",
      title: "タイムライン - CaX",
      initialData: { apiPath: "/api/v1/posts", data: timelineData },
    },
  ];
}

function renderPage(urlPath: string, initialData?: SsgPage["initialData"]): string {
  if (initialData !== undefined) {
    (globalThis as Record<string, unknown>).__SSG_INITIAL_DATA__ = initialData;
  }

  const html = renderToString(
    <StaticRouter location={urlPath}>
      <AppContainer />
    </StaticRouter>,
  );

  (globalThis as Record<string, unknown>).__SSG_INITIAL_DATA__ = undefined;
  return html;
}

function main(): void {
  const indexHtmlPath = path.join(DIST_PATH, "index.html");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

  const pages = buildSsgPages();

  for (const page of pages) {
    let appHtml = renderPage(page.urlPath, page.initialData);
    appHtml = appHtml.replace(/<link rel="preload"[^>]*\/>/g, "");

    let html = indexHtml.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`);

    html = html.replace("<title>CaX</title>", `<title>${page.title}</title>`);

    if (page.initialData !== undefined) {
      const dataScript = `<script id="__INITIAL_DATA__" type="application/json">${JSON.stringify(page.initialData)}</script>`;
      html = html.replace("</head>", `${dataScript}</head>`);
    }

    const outputPath = path.join(DIST_PATH, page.outputFile);
    fs.writeFileSync(outputPath, html);

    console.log(`SSG: Generated ${outputPath}`);
  }
}

main();
