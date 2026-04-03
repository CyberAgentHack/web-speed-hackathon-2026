import { ChangeEvent, ReactNode, useId } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props {
  label: string;
  name: string;
  value: string;
  error?: string;
  touched?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}

export const FormInputField = ({
  label,
  name,
  value,
  error,
  touched,
  onChange,
  onBlur,
  leftItem,
  rightItem,
  type,
  autoComplete,
  placeholder,
}: Props) => {
  const inputId = useId();
  const errorMessageId = useId();
  const isInvalid = touched && error;

  return (
    <div className="flex flex-col gap-y-1">
      <label className="block text-sm" htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        leftItem={leftItem}
        rightItem={rightItem}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={isInvalid ? errorMessageId : undefined}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
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
