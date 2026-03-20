import classNames from "classnames";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  children: string | null | undefined;
}

export const ModalErrorMessage = ({ children }: Props) => {
  return (
    <span className={classNames("block text-cax-danger", { hidden: !children })}>
      <span className="mr-1">
        <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
      </span>
      {children}
    </span>
  );
};
