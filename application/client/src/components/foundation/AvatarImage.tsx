import classNames from "classnames";

import {
  getProfileImagePath,
  getResponsiveProfileImagePath,
  PROFILE_IMAGE_SOURCE_WIDTH,
  RESPONSIVE_PROFILE_IMAGE_WIDTHS,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  profileImage: Models.ProfileImage;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
  crossOrigin?: "anonymous" | "use-credentials";
  fetchPriority?: "high" | "low" | "auto";
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
}

export const AvatarImage = ({
  profileImage,
  className,
  width = 64,
  height = 64,
  alt,
  crossOrigin,
  fetchPriority = "auto",
  onLoad,
}: Props) => {
  const srcSet = [
    ...RESPONSIVE_PROFILE_IMAGE_WIDTHS.filter(
      (candidateWidth) => candidateWidth < PROFILE_IMAGE_SOURCE_WIDTH,
    ).map(
      (candidateWidth) => `${getResponsiveProfileImagePath(profileImage.id, candidateWidth)} ${candidateWidth}w`,
    ),
    `${getProfileImagePath(profileImage.id)} ${PROFILE_IMAGE_SOURCE_WIDTH}w`,
  ].join(", ");

  return (
    <img
      alt={alt ?? profileImage.alt}
      className={classNames(className, "object-cover")}
      crossOrigin={crossOrigin}
      fetchPriority={fetchPriority}
      height={height}
      loading={fetchPriority === "high" ? "eager" : "lazy"}
      onLoad={onLoad}
      sizes={`${width}px`}
      src={getProfileImagePath(profileImage.id)}
      srcSet={srcSet}
      width={width}
    />
  );
};
