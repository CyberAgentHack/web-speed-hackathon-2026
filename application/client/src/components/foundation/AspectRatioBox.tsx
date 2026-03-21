import { ReactNode } from "react";

interface Props {
  aspectHeight: number;
  aspectWidth: number;
  children: ReactNode;
}

export const AspectRatioBox = ({ aspectHeight, aspectWidth, children }: Props) => (
  <div className="relative w-full" style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}` }}>
    <div className="absolute inset-0">{children}</div>
  </div>
);
