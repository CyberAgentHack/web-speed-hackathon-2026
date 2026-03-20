import { FastAverageColor } from "fast-average-color";
import moment from "moment";
import { ReactEventHandler, useCallback, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  user: Models.User;
}

export const UserProfileHeader = ({ user }: Props) => {
  const [averageColor, setAverageColor] = useState<string | null>(null);

  // 画像の平均色を取得します
  /** @type {React.ReactEventHandler<HTMLImageElement>} */
  const handleLoadImage = useCallback<ReactEventHandler<HTMLImageElement>>((ev) => {
    const fac = new FastAverageColor();
    const { rgb } = fac.getColor(ev.currentTarget, { mode: "precision" });
    setAverageColor(rgb);
    fac.destroy();
  }, []);

  return (
    <header className="relative">
      <div
        className={`h-32 ${averageColor ? `bg-[${averageColor}]` : "bg-cax-surface-subtle"}`}
      ></div>
      <div className="border-cax-border bg-cax-surface-subtle absolute left-2/4 m-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border sm:h-32 sm:w-32">
        <img
          alt=""
          crossOrigin="anonymous"
          loading="lazy"
          onLoad={handleLoadImage}
          src={getProfileImagePath(user.profileImage.id)}
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
            <time dateTime={moment(user.createdAt).toISOString()}>
              {moment(user.createdAt).locale("ja").format("LL")}
            </time>
            からサービスを利用しています
          </span>
        </p>
      </div>
    </header>
  );
};
