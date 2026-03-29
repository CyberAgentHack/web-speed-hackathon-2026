import { AccountMenu } from "@web-speed-hackathon-2026/client/src/components/application/AccountMenu";
import { NavigationItem } from "@web-speed-hackathon-2026/client/src/components/application/NavigationItem";
import { DirectMessageNotificationBadge } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageNotificationBadge";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
  newPostModalId: string;
  onLogout: () => void;
}

const HOME_ICON = <FontAwesomeIcon iconType="home" styleType="solid" />;
const SEARCH_ICON = <FontAwesomeIcon iconType="search" styleType="solid" />;
const DM_ICON = <FontAwesomeIcon iconType="envelope" styleType="solid" />;
const EDIT_ICON = <FontAwesomeIcon iconType="edit" styleType="solid" />;
const USER_ICON = <FontAwesomeIcon iconType="user" styleType="solid" />;
const SIGNIN_ICON = <FontAwesomeIcon iconType="sign-in-alt" styleType="solid" />;
const CROK_ICON = <CrokLogo className="h-[30px] w-[30px]" />;
const TERMS_ICON = <FontAwesomeIcon iconType="balance-scale" styleType="solid" />;
const SIGNOUT_ICON = <FontAwesomeIcon iconType="sign-out-alt" styleType="solid" />;

export const Navigation = ({ activeUser, authModalId, newPostModalId, onLogout }: Props) => {
  return (
    <nav className="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r">
      <div className="relative grid grid-flow-col items-center justify-evenly lg:fixed lg:flex lg:h-full lg:w-48 lg:flex-col lg:justify-between lg:p-2">
        <ul className="grid grid-flow-col items-center justify-evenly lg:grid-flow-row lg:auto-rows-min lg:justify-start lg:gap-2">
          <NavigationItem href="/" icon={HOME_ICON} text="ホーム" />
          <NavigationItem href="/search" icon={SEARCH_ICON} text="検索" />
          {activeUser !== null ? (
            <NavigationItem
              badge={<DirectMessageNotificationBadge />}
              href="/dm"
              icon={DM_ICON}
              text="DM"
            />
          ) : null}
          {activeUser !== null ? (
            <NavigationItem
              icon={EDIT_ICON}
              command="show-modal"
              commandfor={newPostModalId}
              text="投稿する"
            />
          ) : null}
          {activeUser !== null ? (
            <NavigationItem
              href={`/users/${activeUser.username}`}
              icon={USER_ICON}
              text="マイページ"
            />
          ) : null}
          {activeUser === null ? (
            <NavigationItem
              icon={SIGNIN_ICON}
              text="サインイン"
              command="show-modal"
              commandfor={authModalId}
            />
          ) : null}
          {activeUser !== null ? (
            <NavigationItem href="/crok" icon={CROK_ICON} text="Crok" />
          ) : null}
          <NavigationItem href="/terms" icon={TERMS_ICON} text="利用規約" />
          {activeUser !== null ? (
            <li className="lg:hidden">
              <button
                aria-label="サインアウト"
                className="hover:bg-cax-brand-soft flex h-12 w-12 flex-col items-center justify-center rounded-full sm:h-auto sm:w-24 sm:rounded-sm sm:px-2"
                type="button"
                onClick={onLogout}
              >
                <span className="relative text-xl">{SIGNOUT_ICON}</span>
                <span className="hidden sm:inline sm:text-sm">サインアウト</span>
              </button>
            </li>
          ) : null}
        </ul>

        {activeUser !== null ? <AccountMenu user={activeUser} onLogout={onLogout} /> : null}
      </div>
    </nav>
  );
};
