import { ReactNode, useId } from "react";
import type { WrappedFieldProps } from "redux-form";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props extends WrappedFieldProps {
  label: string;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
}

export const FormInputField = ({ label, leftItem, rightItem, input, meta, ...props }: Props) => {
  const inputId = useId();
  const errorMessageId = useId();
  const isInvalid = meta.touched && meta.error;

  return (
    <div className="flex flex-col gap-y-1">
      <label className="block text-sm" htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        leftItem={leftItem}
        rightItem={rightItem}
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? errorMessageId : undefined}
        {...input}
        {...props}
      />
      {isInvalid && (
        <span className="text-cax-danger text-xs" id={errorMessageId}>
          <span className="mr-1">
            <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
          </span>
          {meta.error}
        </span>
      )}
    </div>
  );
};
