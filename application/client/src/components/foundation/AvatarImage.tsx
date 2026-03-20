import classNames from "classnames";

import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  profileImage: Models.ProfileImage;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
  crossOrigin?: "anonymous" | "use-credentials";
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
}

export const AvatarImage = ({
  profileImage,
  className,
  width = 64,
  height = 64,
  alt,
  crossOrigin,
  onLoad,
}: Props) => {
  return (
    <img
      alt={alt ?? profileImage.alt}
      className={classNames("h-full w-full object-cover", className)}
      crossOrigin={crossOrigin}
      height={height}
      onLoad={onLoad}
      src={getProfileImagePath(profileImage.id)}
      width={width}
    />
  );
};
