import classNames from "classnames";
import { useCallback } from "react";
import { useLocation } from "react-router";

import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { prefetchRoute } from "@web-speed-hackathon-2026/client/src/utils/prefetch_route";

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
  const handlePrefetch = useCallback(() => {
    if (href != null) {
      prefetchRoute(href);
    }
  }, [href]);

  const handleModalTriggerClick = useCallback(() => {
    if (command !== "show-modal" || commandfor == null || commandfor.length === 0) {
      return;
    }
    const el = document.getElementById(commandfor);
    if (el instanceof HTMLDialogElement) {
      el.showModal();
    }
  }, [command, commandfor]);

  return (
    <li>
      {href !== undefined ? (
        <Link
          className={classNames(
            "flex flex-col items-center justify-center w-12 h-12 hover:bg-cax-brand-soft rounded-full sm:px-2 sm:w-24 sm:h-auto sm:rounded-sm lg:flex-row lg:justify-start lg:px-4 lg:py-2 lg:w-auto lg:h-auto lg:rounded-full",
            { "text-cax-brand": isActive },
          )}
          onFocus={handlePrefetch}
          onMouseEnter={handlePrefetch}
          onTouchStart={handlePrefetch}
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
          className="hover:bg-cax-brand-soft flex h-12 w-12 flex-col items-center justify-center rounded-full sm:h-auto sm:w-24 sm:rounded-sm sm:px-2 lg:h-auto lg:w-auto lg:flex-row lg:justify-start lg:rounded-full lg:px-4 lg:py-2"
          type="button"
          onClick={handleModalTriggerClick}
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
