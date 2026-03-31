interface Props {
  className?: string;
}

export const MediaPlaceholder = ({ className = "" }: Props) => {
  return (
    <div
      aria-hidden={true}
      className={`bg-cax-surface-subtle h-full w-full ${className}`.trim()}
    />
  );
};
