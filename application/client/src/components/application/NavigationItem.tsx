import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import type { ComponentProps } from "react";
import { NewPostModalContainer } from "../../containers/NewPostModalContainer";

type Props = ComponentProps<typeof Link> & {
  badge?: React.ReactNode;
  icon: React.ReactNode;
  text: string;
};

export const NavigationItem = ({ badge, icon, text, ...props }: Props) => {
  return (
    <li>
      <Link
        className="flex flex-col items-center justify-center w-12 h-12 hover:bg-cax-brand-soft rounded-full sm:px-2 sm:w-24 sm:h-auto sm:rounded-sm lg:flex-row lg:justify-start lg:px-4 lg:py-2 lg:w-auto lg:h-auto lg:rounded-full"
        activeProps={{
          className: "text-cax-brand",
        }}
        {...props}
      >
        <span className="relative text-xl lg:pr-2 lg:text-3xl">
          {icon}
          {badge}
        </span>
        <span className="hidden sm:inline sm:text-sm lg:text-xl lg:font-bold">
          {text}
        </span>
      </Link>
    </li>
  );
};

type NavigationItemButtonProps = {
  badge?: React.ReactNode;
  icon: React.ReactNode;
  text: string;
  command?: string;
  commandfor?: string;
};

export const NavigationItemButton = ({
  badge,
  icon,
  command,
  commandfor,
  text,
}: NavigationItemButtonProps) => {
  return (
    <li>
      <button
        className="hover:bg-cax-brand-soft flex h-12 w-12 flex-col items-center justify-center rounded-full sm:h-auto sm:w-24 sm:rounded-sm sm:px-2 lg:h-auto lg:w-auto lg:flex-row lg:justify-start lg:rounded-full lg:px-4 lg:py-2"
        type="button"
        command={command}
        commandfor={commandfor}
      >
        <span className="relative text-xl lg:pr-2 lg:text-3xl">
          {icon}
          {badge}
        </span>
        <span className="hidden sm:inline sm:text-sm lg:text-xl lg:font-bold">
          {text}
        </span>
      </button>
    </li>
  );
};
