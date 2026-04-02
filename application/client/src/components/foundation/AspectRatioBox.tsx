import { ReactNode } from "react";

interface Props {
  aspectHeight: number;
  aspectWidth: number;
  children: ReactNode;
}

/**
 * 親要素の横幅を基準にして、指定したアスペクト比のブロック要素を作ります
 */
export const AspectRatioBox = ({ aspectHeight, aspectWidth, children }: Props) => {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}` }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
};
