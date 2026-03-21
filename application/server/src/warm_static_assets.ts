import { Image, Movie, ProfileImage } from "@web-speed-hackathon-2026/server/src/models";
import {
  warmMovieThumbnail,
  warmResizedImage,
} from "@web-speed-hackathon-2026/server/src/routes/static";

const PROFILE_IMAGE_WIDTHS = [64, 96, 128];
const POST_IMAGE_WIDTHS = [640];
const WARMUP_CONCURRENCY = 6;

async function runWithConcurrency(tasks: Array<() => Promise<void>>, concurrency: number) {
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (index < tasks.length) {
      const currentIndex = index++;
      await tasks[currentIndex]!();
    }
  });

  await Promise.all(workers);
}

export async function warmStaticAssets(): Promise<void> {
  const [images, profileImages, movies] = await Promise.all([
    Image.findAll({ attributes: ["id"], logging: false }),
    ProfileImage.findAll({ attributes: ["id"], logging: false }),
    Movie.findAll({ attributes: ["id"], logging: false }),
  ]);

  const tasks: Array<() => Promise<void>> = [];

  for (const image of images) {
    for (const width of POST_IMAGE_WIDTHS) {
      tasks.push(() => warmResizedImage(`/images/${image.id}.jpg`, width));
    }
  }

  for (const profileImage of profileImages) {
    for (const width of PROFILE_IMAGE_WIDTHS) {
      tasks.push(() => warmResizedImage(`/images/profiles/${profileImage.id}.jpg`, width));
    }
  }

  for (const movie of movies) {
    tasks.push(() => warmMovieThumbnail(`/movies/${movie.id}.gif`));
  }

  await runWithConcurrency(tasks, WARMUP_CONCURRENCY);
}
