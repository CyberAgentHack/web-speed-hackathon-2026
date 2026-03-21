import { type ReactNode, useId } from "react";
import type { WrappedFieldProps } from "redux-form";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props extends WrappedFieldProps {
  label: string;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
}

export const FormInputField = ({
  label,
  leftItem,
  rightItem,
  input,
  meta,
  ...props
}: Props) => {
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 512 512"
              fill="currentColor"
              className="inline"
            >
              <path d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"></path>
            </svg>
          </span>
          {meta.error}
        </span>
      )}
    </div>
  );
};
