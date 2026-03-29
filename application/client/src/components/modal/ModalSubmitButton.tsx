import type { ComponentPropsWithRef } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props extends ComponentPropsWithRef<typeof Button> {
  loading: boolean;
}

export const ModalSubmitButton = ({
  loading,
  leftItem,
  children,
  ...props
}: Props) => {
  return (
    <Button
      type="submit"
      leftItem={
        loading ? (
          <span className="animate-spin">
            <FontAwesomeIcon iconType="circle-notch" styleType="solid" />
          </span>
        ) : (
          leftItem
        )
      }
      {...props}
    >
      {children}
    </Button>
  );
};
