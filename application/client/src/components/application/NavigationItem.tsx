import classNames from "classnames";
import { useLocation } from "react-router";

import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";

interface Props {
  badge?: React.ReactNode;
  icon: React.ReactNode;
  text: string;
  href?: string;
  command?: string;
  commandfor?: string;
}

export const NavigationItem = ({ badge, href, icon, command, commandfor, text }: Props) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  const sharedClassName = classNames(
    "flex flex-col items-center justify-center w-12 h-12 hover:bg-cax-brand-soft rounded-full sm:px-2 sm:w-24 sm:h-auto sm:rounded-sm lg:flex-row lg:justify-start lg:px-4 lg:py-2 lg:w-auto lg:h-auto lg:rounded-full",
    { "text-cax-brand": isActive },
  );

  const content = (
    <>
      <span className="relative text-xl lg:pr-2 lg:text-3xl">
        {icon}
        {badge}
      </span>
      <span className="hidden sm:inline sm:text-sm lg:text-xl lg:font-bold">{text}</span>
    </>
  );

  return (
    <li>
      {href !== undefined ? (
        <Link className={sharedClassName} to={href}>
          {content}
        </Link>
      ) : (
        <button
          className={sharedClassName}
          type="button"
          command={command}
          commandfor={commandfor}
          onClick={() => {
            if (commandfor && command === "show-modal") {
              const el = document.getElementById(commandfor);
              if (el instanceof HTMLDialogElement && !el.open) {
                el.showModal();
              }
            }
          }}
        >
          {content}
        </button>
      )}
    </li>
  );
};
