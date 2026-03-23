import { useLocation } from "wouter";

import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { runDialogCommand } from "@web-speed-hackathon-2026/client/src/utils/dialog";

interface Props {
  badge?: React.ReactNode;
  icon: React.ReactNode;
  text: string;
  href?: string;
  command?: string;
  commandfor?: string;
}

export const NavigationItem = ({ badge, href, icon, command, commandfor, text }: Props) => {
  const [pathname] = useLocation();
  const isActive = pathname === href;
  return (
    <li>
      {href !== undefined ? (
        <Link
          className={`flex h-12 w-12 flex-col items-center justify-center rounded-full hover:bg-cax-brand-soft sm:h-auto sm:w-24 sm:rounded-sm sm:px-2 lg:h-auto lg:w-auto lg:flex-row lg:justify-start lg:rounded-full lg:px-4 lg:py-2 ${isActive ? "text-cax-brand" : ""}`}
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
          command={command}
          commandfor={commandfor}
          onClick={() => runDialogCommand(command, commandfor)}
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
