import { ReactNode, useId } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props {
  label: string;
  name: string;
  value: string;
  error?: string;
  touched?: boolean;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
}

export const FormInputField = ({ label, name, value, error, touched, leftItem, rightItem, type, autoComplete, placeholder, onChange, onBlur }: Props) => {
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
        name={name}
        value={value}
        leftItem={leftItem}
        rightItem={rightItem}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={isInvalid ? errorMessageId : undefined}
        onChange={onChange}
        onBlur={onBlur}
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
