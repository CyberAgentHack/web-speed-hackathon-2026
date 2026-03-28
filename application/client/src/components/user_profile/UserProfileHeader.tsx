import { FastAverageColor } from "fast-average-color";
import { ReactEventHandler, useCallback, useMemo, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  user: Models.User;
}

export const UserProfileHeader = ({ user }: Props) => {
  const [averageColor, setAverageColor] = useState<string | null>(null);

  // FastAverageColor を毎回 new しない
  const facRef = useRef<FastAverageColor | null>(null);

  const handleLoadImage = useCallback<ReactEventHandler<HTMLImageElement>>((ev) => {
    if (facRef.current == null) {
      facRef.current = new FastAverageColor();
    }

    const { rgb } = facRef.current.getColor(ev.currentTarget, {
      mode: "precision",
    });

    setAverageColor(rgb);
  }, []);

  const createdAt = useMemo(() => {
    const date = new Date(user.createdAt);

    return {
      iso: date.toISOString(),
      label: date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }, [user.createdAt]);

  return (
    <header className="relative">
      <div
        className={`h-32 ${
          averageColor ? `bg-[${averageColor}]` : "bg-cax-surface-subtle"
        }`}
      />

      <div className="border-cax-border bg-cax-surface-subtle absolute left-2/4 m-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border sm:h-32 sm:w-32">
        <img
          alt=""
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
          decoding="async"
          height={128}
          loading="lazy"
          onLoad={handleLoadImage}
          src={getProfileImagePath(user.profileImage.id, "thumb")}
          width={128}
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
            <time dateTime={createdAt.iso}>{createdAt.label}</time>
            からサービスを利用しています
          </span>
        </p>
      </div>
    </header>
  );
};