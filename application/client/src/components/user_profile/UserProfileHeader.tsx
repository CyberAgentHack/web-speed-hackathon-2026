import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";
import { formatJaLongDate, toIsoDateTime } from "@web-speed-hackathon-2026/client/src/utils/temporal";

interface Props {
  user: Models.User;
}

export const UserProfileHeader = ({ user }: Props) => {
  return (
    <header className="relative">
      <div
        className="bg-cax-surface-subtle h-32"
        style={user.profileImage.averageColor == null
          ? undefined
          : { backgroundColor: user.profileImage.averageColor }}
      ></div>
      <div className="border-cax-border bg-cax-surface-subtle absolute left-2/4 m-0 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border sm:h-32 sm:w-32">
        <img
          alt=""
          src={getProfileImagePath(user.profileImage.id)}
          width={128}
          height={128}
          loading="lazy"
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
            <time dateTime={toIsoDateTime(user.createdAt)}>
              {formatJaLongDate(user.createdAt)}
            </time>
            からサービスを利用しています
          </span>
        </p>
      </div>
    </header>
  );
};
