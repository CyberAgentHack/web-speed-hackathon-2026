import {
  getProfileImagePath,
  getProfileImageSrcSet,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  alt: string;
  className?: string;
  crossOrigin?: "anonymous" | "use-credentials";
  imageId: string;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
}

export const ProfileAvatar = ({ alt, className, crossOrigin, imageId, onLoad }: Props) => {
  return (
    <picture>
      <source
        sizes="(max-width: 640px) 64px, 128px"
        srcSet={getProfileImageSrcSet(imageId, "webp")}
        type="image/webp"
      />
      <img
        alt={alt}
        className={["object-cover", className].filter(Boolean).join(" ")}
        crossOrigin={crossOrigin}
        decoding="async"
        sizes="(max-width: 640px) 64px, 128px"
        src={getProfileImagePath(imageId)}
        srcSet={getProfileImageSrcSet(imageId, "jpg")}
        onLoad={onLoad}
      />
    </picture>
  );
};
