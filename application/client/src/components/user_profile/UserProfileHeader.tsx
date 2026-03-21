import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { formatDate } from "@web-speed-hackathon-2026/client/src/utils/date";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  user: Models.User;
}

export const UserProfileHeader = ({ user }: Props) => {
  const [averageColor, setAverageColor] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;
    let didCancel = false;

    import("fast-average-color").then(({ FastAverageColor }) => {
      if (didCancel) return;
      const fac = new FastAverageColor();
      fac
        .getColorAsync(imgRef.current!)
        .then((color) => {
          if (!didCancel) setAverageColor(color.hex);
        })
        .catch((e) => {
          console.warn("Failed to extract color:", e);
        })
        .finally(() => {
          fac.destroy();
        });
    });

    return () => {
      didCancel = true;
    };
  }, [user.profileImage.id]);

  return (
    <header className="relative">
      <div
        className={`h-32 ${!averageColor ? "bg-cax-surface-subtle" : ""}`}
        style={averageColor ? { backgroundColor: averageColor } : undefined}
      ></div>
      <div className="border-cax-border bg-cax-surface-subtle absolute left-2/4 m-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border sm:h-32 sm:w-32">
        <img
          ref={imgRef}
          alt=""
          crossOrigin="anonymous"
          src={getProfileImagePath(user.profileImage.id)}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="px-4 pt-20">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="text-cax-text-muted">@{user.username}</p>
        <p className="pt-2">{user.description}</p>
        <p className="text-cax-text-muted pt-2 text-sm">
          <span className="pr-1">
            <FontAwesomeIcon iconType="calendar-alt" styleType="regular" />
          </span>
          <span>
            <time dateTime={new Date(user.createdAt).toISOString()}>
              {formatDate(user.createdAt)}
            </time>
            からサービスを利用しています
          </span>
        </p>
      </div>
    </header>
  );
};
