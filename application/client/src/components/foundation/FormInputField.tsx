import { ChangeEventHandler, ComponentPropsWithRef, FocusEventHandler, ReactNode, useId } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";

interface Props
  extends Omit<
    ComponentPropsWithRef<"input">,
    "value" | "onChange" | "onBlur" | "aria-invalid" | "aria-describedby"
  > {
  label: string;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  error?: string;
  touched?: boolean;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur: FocusEventHandler<HTMLInputElement>;
}

export const FormInputField = ({
  label,
  leftItem,
  rightItem,
  error,
  touched,
  value,
  onChange,
  onBlur,
  ...props
}: Props) => {
  const inputId = useId();
  const errorMessageId = useId();
  const isInvalid = Boolean(touched && error);

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
