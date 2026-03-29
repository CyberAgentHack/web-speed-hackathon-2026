import { FastAverageColor } from "fast-average-color";
import { ReactEventHandler, useCallback, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  user: Models.User;
}
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
});

export const UserProfileHeader = ({ user }: Props) => {
  const [averageColor, setAverageColor] = useState<string | null>(null);

  // 画像の平均色を取得します
  const handleLoadImage = useCallback<ReactEventHandler<HTMLImageElement>>((ev) => {
    const fac = new FastAverageColor();
    const { rgb } = fac.getColor(ev.currentTarget, { mode: "precision" });
    setAverageColor(rgb);
    fac.destroy();
  }, []);

  const formattedDate = useMemo(() => {
    return dateFormatter.format(new Date(user.createdAt));
  }, [user.createdAt]);

  return (
    <header className="relative">
      <div
        className="h-32 bg-cax-surface-subtle"
        style={averageColor ? { backgroundColor: averageColor } : {}}
      ></div>
      <div className="border-cax-border bg-cax-surface-subtle absolute left-2/4 m-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border sm:h-32 sm:w-32">
        <img
          alt=""
          crossOrigin="anonymous"
          onLoad={handleLoadImage}
          src={getProfileImagePath(user.profileImage.id, 128)}
          width={128}
          height={128}
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
              {formattedDate}
            </time>
            からサービスを利用しています
          </span>
        </p>
      </div>
    </header>
  );
};
