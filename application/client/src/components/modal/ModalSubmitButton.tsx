import { ComponentPropsWithRef } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";

interface Props extends ComponentPropsWithRef<typeof Button> {
  loading: boolean;
}

export const ModalSubmitButton = ({ loading, leftItem, children, ...props }: Props) => {
  return (
    <Button
      type="submit"
      leftItem={
        loading ? (
          <span className="animate-spin">
            <FontAwesomeIcon icon={faCircleNotch} />
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
