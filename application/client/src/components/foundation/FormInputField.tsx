import { ReactNode, useId } from "react";
import { ControllerRenderProps, FieldError } from "react-hook-form";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props {
  label: string;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  field: ControllerRenderProps<any, any>;
  error?: FieldError;
  isTouched?: boolean;
  [key: string]: unknown;
}

export const FormInputField = ({
  label,
  leftItem,
  rightItem,
  field,
  error,
  isTouched,
  ...props
}: Props) => {
  const inputId = useId();
  const errorMessageId = useId();
  const isInvalid = !!error && isTouched;

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
        {...field}
        {...props}
      />
      {isInvalid && (
        <span className="text-cax-danger text-xs" id={errorMessageId}>
          <span className="mr-1">
            <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
          </span>
          {error.message}
        </span>
      )}
    </div>
  );
};
