import { ChangeEvent, ReactNode, useId } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

export const FormInputField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  leftItem,
  rightItem,
  ...props
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
        {...props}
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
