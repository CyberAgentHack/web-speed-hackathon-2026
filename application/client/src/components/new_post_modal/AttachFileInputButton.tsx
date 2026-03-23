import classNames from "classnames";
import { ChangeEventHandler, ReactNode } from "react";

interface Props {
  accept: string;
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export const AttachFileInputButton = ({ accept, active, disabled, icon, label, onChange }: Props) => {
  return (
    <label
      className={classNames(
        "focus-within:outline-cax-brand relative flex items-center justify-center overflow-hidden rounded-full focus-within:outline-2 focus-within:outline-offset-2",
        {
          "cursor-pointer": !disabled,
          "cursor-not-allowed opacity-50": disabled,
        },
      )}
    >
      <span
        className={classNames("flex items-center justify-center w-12 h-12", {
          "bg-cax-surface-subtle": !active,
          "bg-cax-brand-soft": active,
        })}
      >
        {icon}
      </span>
      <input
        multiple
        accept={accept}
        aria-label={label}
        className="sr-only"
        disabled={disabled}
        onChange={onChange}
        type="file"
      />
    </label>
  );
};
