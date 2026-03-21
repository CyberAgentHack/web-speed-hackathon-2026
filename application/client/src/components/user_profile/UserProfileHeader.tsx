import { FastAverageColor } from "fast-average-color";
import { ReactEventHandler, useCallback, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { formatLL } from "@web-speed-hackathon-2026/client/src/utils/format_date";
import { getProfileImagePath, getProfileImageSrcSet } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  user: Models.User;
}

export const UserProfileHeader = ({ user }: Props) => {
  const [averageColor, setAverageColor] = useState<string | null>(null);

  // 色抽出用: フルサイズの元画像から平均色を取得します
  /** @type {React.ReactEventHandler<HTMLImageElement>} */
  const handleColorImage = useCallback<ReactEventHandler<HTMLImageElement>>((ev) => {
    const fac = new FastAverageColor();
    const { rgb } = fac.getColor(ev.currentTarget, { mode: "precision" });
    setAverageColor(rgb);
    fac.destroy();
  }, []);

  return (
    <header className="relative">
      {/* 色抽出専用の非表示画像（srcSetなしでフルサイズ元画像を使用） */}
      <img
        alt=""
        crossOrigin="anonymous"
        onLoad={handleColorImage}
        src={getProfileImagePath(user.profileImage.id)}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
      />
      <div
        className={`h-32 ${averageColor ? `bg-[${averageColor}]` : "bg-cax-surface-subtle"}`}
      ></div>
      <div className="border-cax-border bg-cax-surface-subtle absolute left-2/4 m-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border sm:h-32 sm:w-32">
        <img
          alt=""
          crossOrigin="anonymous"
          src={getProfileImagePath(user.profileImage.id)}
          srcSet={getProfileImageSrcSet(user.profileImage.id)}
          sizes="128px"
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
              {formatLL(user.createdAt)}
            </time>
            からサービスを利用しています
          </span>
        </p>
      </div>
    </header>
  );
};
