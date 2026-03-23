import { ChangeEventHandler, ReactNode } from "react";

interface Props {
  accept: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export const AttachFileInputButton = ({ accept, active, icon, label, onChange }: Props) => {
  return (
    <label className="focus-within:outline-cax-brand relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full focus-within:outline-2 focus-within:outline-offset-2">
      <span
        className={`flex h-12 w-12 items-center justify-center ${active ? "bg-cax-brand-soft" : "bg-cax-surface-subtle"}`}
      >
        {icon}
      </span>
      <input
        multiple
        accept={accept}
        aria-label={label}
        className="sr-only"
        onChange={onChange}
        type="file"
      />
    </label>
  );
};
