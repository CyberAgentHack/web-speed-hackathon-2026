import { useEffect, useState } from "react";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const [posts, setPosts] = useState<Models.Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON<Models.Post[]>("/api/v1/posts")
      .then(setPosts)
      .catch((err) => console.error("Failed to fetch posts:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center">読み込み中...</div>;

  return <TimelinePage posts={posts} />;
};
