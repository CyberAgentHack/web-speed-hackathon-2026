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
  const itemClassName =
    "flex flex-col items-center justify-center w-12 h-12 sm:px-2 sm:w-24 sm:h-auto lg:flex-row lg:justify-start lg:px-4 lg:py-2 lg:w-auto lg:h-auto";

  return (
    <li className="hover:bg-cax-brand-soft rounded-full transition-colors sm:rounded-sm lg:rounded-full">
      {href !== undefined ? (
        <Link
          className={classNames(
            itemClassName,
            { "text-cax-brand": isActive },
          )}
          to={href}
        >
          <span className="relative text-xl lg:pr-2 lg:text-3xl">
            {icon}
            {badge}
          </span>
          <span className="hidden sm:inline sm:text-sm lg:text-xl lg:font-bold">{text}</span>
        </Link>
      ) : (
        <button
          className={itemClassName}
          type="button"
          command={command}
          commandfor={commandfor}
        >
          <span className="relative text-xl lg:pr-2 lg:text-3xl">
            {icon}
            {badge}
          </span>
          <span className="hidden sm:inline sm:text-sm lg:text-xl lg:font-bold">{text}</span>
        </button>
      )}
    </li>
  );
};
