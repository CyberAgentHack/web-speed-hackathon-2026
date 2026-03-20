import classNames from "classnames";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  children: string | null;
}

export const ModalErrorMessage = ({ children }: Props) => {
  return (
    <span className={classNames("block text-cax-danger", { hidden: !children })}>
      <span className="mr-1">
        <FontAwesomeIcon icon={faExclamationCircle} />
      </span>
      {children}
    </span>
  );
};
