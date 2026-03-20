import { AccountMenu } from "@web-speed-hackathon-2026/client/src/components/application/AccountMenu";
import { NavigationItem } from "@web-speed-hackathon-2026/client/src/components/application/NavigationItem";
import { DirectMessageNotificationBadge } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageNotificationBadge";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBalanceScale,
  faEdit,
  faEnvelope,
  faHome,
  faSearch,
  faSignInAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
  newPostModalId: string;
  onLogout: () => void;
}

export const Navigation = ({ activeUser, authModalId, newPostModalId, onLogout }: Props) => {
  return (
    <nav className="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r">
      <div className="relative grid grid-flow-col items-center justify-evenly lg:fixed lg:flex lg:h-full lg:w-48 lg:flex-col lg:justify-between lg:p-2">
        <ul className="grid grid-flow-col items-center justify-evenly lg:grid-flow-row lg:auto-rows-min lg:justify-start lg:gap-2">
          <NavigationItem href="/" icon={<FontAwesomeIcon icon={faHome} />} text="ホーム" />
          <NavigationItem href="/search" icon={<FontAwesomeIcon icon={faSearch} />} text="検索" />
          {activeUser !== null ? (
            <NavigationItem
              badge={<DirectMessageNotificationBadge />}
              href="/dm"
              icon={<FontAwesomeIcon icon={faEnvelope} />}
              text="DM"
            />
          ) : null}
          {activeUser !== null ? (
            <NavigationItem
              icon={<FontAwesomeIcon icon={faEdit} />}
              command="show-modal"
              commandfor={newPostModalId}
              text="投稿する"
            />
          ) : null}
          {activeUser !== null ? (
            <NavigationItem
              href={`/users/${activeUser.username}`}
              icon={<FontAwesomeIcon icon={faUser} />}
              text="マイページ"
            />
          ) : null}
          {activeUser === null ? (
            <NavigationItem
              icon={<FontAwesomeIcon icon={faSignInAlt} />}
              text="サインイン"
              command="show-modal"
              commandfor={authModalId}
            />
          ) : null}
          {activeUser !== null ? (
            <NavigationItem
              href="/crok"
              icon={<CrokLogo className="h-[30px] w-[30px]" />}
              text="Crok"
            />
          ) : null}
          <NavigationItem
            href="/terms"
            icon={<FontAwesomeIcon icon={faBalanceScale} />}
            text="利用規約"
          />
        </ul>

        {activeUser !== null ? <AccountMenu user={activeUser} onLogout={onLogout} /> : null}
      </div>
    </nav>
  );
};
