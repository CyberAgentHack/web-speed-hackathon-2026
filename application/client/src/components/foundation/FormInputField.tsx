import { InputHTMLAttributes, ReactNode, useId } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  error?: string;
}

export const FormInputField = ({ label, leftItem, rightItem, error, ...inputProps }: Props) => {
  const inputId = useId();
  const errorMessageId = useId();

  return (
    <div className="flex flex-col gap-y-1">
      <label className="block text-sm" htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        leftItem={leftItem}
        rightItem={rightItem}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorMessageId : undefined}
        {...inputProps}
      />
      {error && (
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
