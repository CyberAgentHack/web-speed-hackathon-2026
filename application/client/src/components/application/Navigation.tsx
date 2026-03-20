import type { AuthStatus } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AccountMenu } from "@web-speed-hackathon-2026/client/src/components/application/AccountMenu";
import { NavigationItem } from "@web-speed-hackathon-2026/client/src/components/application/NavigationItem";
import { DirectMessageNotificationBadge } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageNotificationBadge";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

const AUTH_LOADING_PLACEHOLDER_COUNT = 4;

const NavigationLoadingItem = () => {
  return (
    <li aria-hidden="true">
      <div className="pointer-events-none flex h-12 w-12 flex-col items-center justify-center rounded-full sm:h-auto sm:w-24 sm:px-2 lg:h-auto lg:w-auto lg:flex-row lg:justify-start lg:px-4 lg:py-2">
        <span className="relative flex items-center justify-center text-xl lg:pr-2 lg:text-3xl">
          <span className="bg-cax-surface-subtle animate-pulse block h-6 w-6 rounded-full lg:h-8 lg:w-8" />
        </span>
        <span className="bg-cax-surface-subtle animate-pulse mt-1 hidden h-4 w-12 rounded sm:block lg:mt-0 lg:h-5 lg:w-20" />
      </div>
    </li>
  );
};

const AccountMenuLoadingPlaceholder = () => {
  return (
    <div aria-hidden="true" className="hidden lg:block lg:w-full lg:pb-2">
      <div className="flex w-full items-center gap-3 rounded-full p-2">
        <div className="bg-cax-surface-subtle animate-pulse h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="bg-cax-surface-subtle animate-pulse h-4 w-20 rounded" />
          <div className="bg-cax-surface-subtle animate-pulse h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
};

interface Props {
  activeUser: Models.User | null;
  authStatus: AuthStatus;
  authModalId: string;
  newPostModalId: string;
  onLogout: () => void;
}

export const Navigation = ({
  activeUser,
  authStatus,
  authModalId,
  newPostModalId,
  onLogout,
}: Props) => {
  const isAuthLoading = authStatus === "loading";
  const isSignedIn = authStatus === "signedIn" && activeUser !== null;

  return (
    <nav className="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r">
      <div className="relative grid grid-flow-col items-center justify-evenly lg:fixed lg:flex lg:h-full lg:w-48 lg:flex-col lg:justify-between lg:p-2">
        <ul className="grid grid-flow-col items-center justify-evenly lg:grid-flow-row lg:auto-rows-min lg:justify-start lg:gap-2">
          <NavigationItem
            href="/"
            icon={<FontAwesomeIcon iconType="home" styleType="solid" />}
            text="ホーム"
          />
          <NavigationItem
            href="/search"
            icon={<FontAwesomeIcon iconType="search" styleType="solid" />}
            text="検索"
          />
          {isAuthLoading
            ? Array.from({ length: AUTH_LOADING_PLACEHOLDER_COUNT }, (_, index) => (
                <NavigationLoadingItem key={index} />
              ))
            : null}
          {isSignedIn ? (
            <NavigationItem
              badge={<DirectMessageNotificationBadge />}
              href="/dm"
              icon={<FontAwesomeIcon iconType="envelope" styleType="solid" />}
              text="DM"
            />
          ) : null}
          {isSignedIn ? (
            <NavigationItem
              icon={<FontAwesomeIcon iconType="edit" styleType="solid" />}
              command="show-modal"
              commandfor={newPostModalId}
              text="投稿する"
            />
          ) : null}
          {isSignedIn ? (
            <NavigationItem
              href={`/users/${activeUser.username}`}
              icon={<FontAwesomeIcon iconType="user" styleType="solid" />}
              text="マイページ"
            />
          ) : null}
          {authStatus === "signedOut" ? (
            <NavigationItem
              icon={<FontAwesomeIcon iconType="sign-in-alt" styleType="solid" />}
              text="サインイン"
              command="show-modal"
              commandfor={authModalId}
            />
          ) : null}
          {isSignedIn ? (
            <NavigationItem
              href="/crok"
              icon={<CrokLogo className="h-[30px] w-[30px]" />}
              text="Crok"
            />
          ) : null}
          <NavigationItem
            href="/terms"
            icon={<FontAwesomeIcon iconType="balance-scale" styleType="solid" />}
            text="利用規約"
          />
        </ul>

        {isAuthLoading ? <AccountMenuLoadingPlaceholder /> : null}
        {isSignedIn ? <AccountMenu user={activeUser} onLogout={onLogout} /> : null}
      </div>
    </nav>
  );
};
