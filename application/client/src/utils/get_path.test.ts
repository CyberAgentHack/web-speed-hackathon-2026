import { describe, expect, test } from "vitest";

import { getImagePath, getMoviePath, getProfileImagePath, getSoundPath } from "./get_path";

describe("getImagePath", () => {
  test("imageId → /images/{id}.jpg", () => {
    expect(getImagePath("abc123")).toBe("/images/abc123.jpg");
  });
});

describe("getMoviePath", () => {
  test("movieId → /movies/{id}.mp4", () => {
    expect(getMoviePath("mov456")).toBe("/movies/mov456.mp4");
  });
});

describe("getSoundPath", () => {
  test("soundId → /sounds/{id}.mp3", () => {
    expect(getSoundPath("snd789")).toBe("/sounds/snd789.mp3");
  });
});

describe("getProfileImagePath", () => {
  test("profileImageId → /images/profiles/{id}.jpg", () => {
    expect(getProfileImagePath("prof001")).toBe("/images/profiles/prof001.jpg");
  });
});
