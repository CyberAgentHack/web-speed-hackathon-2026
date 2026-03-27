import classNames from "classnames";
import { FastAverageColor } from "fast-average-color";
import { ReactEventHandler, useCallback, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const dtf = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" });

interface Props {
  user: Models.User;
}

export const UserProfileHeader = ({ user }: Props) => {
  const [averageColor, setAverageColor] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // 画像の平均色を取得します
  /** @type {React.ReactEventHandler<HTMLImageElement>} */
  const handleLoadImage = useCallback<ReactEventHandler<HTMLImageElement>>((ev) => {
    const fac = new FastAverageColor();
    const { rgb } = fac.getColor(ev.currentTarget, { mode: "precision" });
    setAverageColor(rgb);
    fac.destroy();
    setProfileLoaded(true);
  }, []);

  return (
    <header className="relative">
      <div
        className={`h-32 ${averageColor ? `bg-[${averageColor}]` : "bg-cax-surface-subtle"}`}
      ></div>
      <div className={classNames(
        "border-cax-border bg-cax-surface-subtle absolute left-2/4 m-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border sm:h-32 sm:w-32",
        { "animate-pulse": !profileLoaded },
      )}>
        <img
          alt=""
          className={`transition-opacity duration-300 ${profileLoaded ? "opacity-100" : "opacity-0"}`}
          crossOrigin="anonymous"
          height={256}
          onLoad={handleLoadImage}
          src={getProfileImagePath(user.profileImage.id, 256)}
          width={256}
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
              {dtf.format(new Date(user.createdAt))}
            </time>
            からサービスを利用しています
          </span>
        </p>
      </div>
    </header>
  );
};
