import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  alt?: string;
  className?: string;
  crossOrigin?: "anonymous" | "use-credentials";
  height: number;
  loading?: "eager" | "lazy";
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  profileImage: Models.ProfileImage;
  width: number;
}

export const ProfileImage = ({
  alt,
  className,
  crossOrigin,
  height,
  loading,
  onLoad,
  profileImage,
  width,
}: Props) => {
  return (
    <img
      alt={alt ?? profileImage.alt}
      className={className}
      crossOrigin={crossOrigin}
      height={height}
      loading={loading}
      onLoad={onLoad}
      src={getProfileImagePath(profileImage.id)}
      width={width}
    />
  );
};
