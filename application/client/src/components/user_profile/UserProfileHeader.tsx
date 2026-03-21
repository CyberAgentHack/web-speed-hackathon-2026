import { FastAverageColor } from "fast-average-color";
import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { formatJapaneseDate } from "@web-speed-hackathon-2026/client/src/utils/date";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  user: Models.User;
}

export const UserProfileHeader = ({ user }: Props) => {
  const profileImagePath = getProfileImagePath(user.profileImage.id);
  const [averageColor, setAverageColor] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";

    const handleReady = () => {
      if (isCancelled) return;

      const fac = new FastAverageColor();
      try {
        const { rgb } = fac.getColor(image, { mode: "precision" });
        setAverageColor(rgb);
      } finally {
        fac.destroy();
        setIsReady(true);
      }
    };

    const handleError = () => {
      if (isCancelled) return;
      setIsReady(true);
    };

    image.addEventListener("load", handleReady);
    image.addEventListener("error", handleError);
    image.src = profileImagePath;

    if (image.complete && image.naturalWidth > 0) {
      handleReady();
    }

    return () => {
      isCancelled = true;
      image.removeEventListener("load", handleReady);
      image.removeEventListener("error", handleError);
    };
  }, [profileImagePath]);

  return (
    <header className="relative">
      {isReady ? (
        <>
          <div
            className="h-32 bg-cax-surface-subtle"
            style={averageColor ? { backgroundColor: averageColor } : undefined}
          ></div>
          <div className="border-cax-border bg-cax-surface-subtle absolute left-2/4 m-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border sm:h-32 sm:w-32">
            <img alt="" crossOrigin="anonymous" src={profileImagePath} />
          </div>
        </>
      ) : null}
      <div className="px-4 pt-20">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="text-cax-text-muted">@{user.username}</p>
        <p className="pt-2">{user.description}</p>
        <p className="text-cax-text-muted pt-2 text-sm">
          <span className="pr-1">
            <FontAwesomeIcon iconType="calendar-alt" styleType="regular" />
          </span>
          <span>
            <time dateTime={user.createdAt}>{formatJapaneseDate(user.createdAt)}</time>
            からサービスを利用しています
          </span>
        </p>
      </div>
    </header>
  );
};
