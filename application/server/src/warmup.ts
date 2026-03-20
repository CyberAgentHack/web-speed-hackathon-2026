/**
 * Pre-warm the image optimization cache by requesting the first few posts'
 * images so that sharp conversion is done before any user/Lighthouse request.
 */
export async function warmImageCache(port: number): Promise<void> {
  const base = `http://localhost:${port}`;

  try {
    const res = await fetch(`${base}/api/v1/posts?offset=0&limit=10`);
    if (!res.ok) return;
    const posts: any[] = await res.json();

    const imageUrls: string[] = [];
    for (const post of posts) {
      // Post images
      if (post.images) {
        for (const img of post.images) {
          imageUrls.push(`/images/${img.id}.jpg?w=640`);
        }
      }
      // Profile images
      if (post.user?.profileImage) {
        imageUrls.push(`/images/profiles/${post.user.profileImage.id}.jpg`);
      }
    }

    // Fetch images concurrently (with concurrency limit)
    const CONCURRENCY = 4;
    for (let i = 0; i < imageUrls.length; i += CONCURRENCY) {
      const batch = imageUrls.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map((url) =>
          fetch(`${base}${url}`, {
            headers: { Accept: "image/avif,image/webp,*/*" },
          }).catch(() => {}),
        ),
      );
    }

    console.log(`Warmed image cache: ${imageUrls.length} images`);
  } catch {
    // Non-critical, silently ignore
  }
}
