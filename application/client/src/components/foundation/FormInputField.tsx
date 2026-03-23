import { ComponentPropsWithRef, ReactNode, useId } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props extends ComponentPropsWithRef<"input"> {
  label: string;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  error?: string;
  touched?: boolean;
}

export const FormInputField = ({
  label,
  leftItem,
  rightItem,
  error,
  touched,
  ...inputProps
}: Props) => {
  const inputId = useId();
  const errorMessageId = useId();
  const isInvalid = touched && error;
  const fallbackAriaLabel =
    inputProps["aria-label"] ??
    (label.trim() !== ""
      ? label
      : typeof inputProps.placeholder === "string"
        ? inputProps.placeholder
        : undefined);

  return (
    <div className="flex flex-col gap-y-1">
      <label className="block text-sm" htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        leftItem={leftItem}
        rightItem={rightItem}
        aria-label={fallbackAriaLabel}
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? errorMessageId : undefined}
        {...inputProps}
      />
      {isInvalid && (
        <span className="text-cax-danger text-xs" id={errorMessageId}>
          <span className="mr-1">
            <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
          </span>
          {error}
        </span>
      )}
    </div>
  );
};
