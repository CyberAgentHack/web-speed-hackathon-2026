import { AccountMenu } from "./AccountMenu";
import { NavigationItem } from "./NavigationItem";
import { CrokLogo } from "../foundation/CrokLogo";
import { FontAwesomeIcon } from "../foundation/FontAwesomeIcon";

export const Navigation = ({ activeUser, authModalId, newPostModalId, onLogout }: any) => {
  return (
    <nav className="border-cax-border bg-cax-surface fixed bottom-0 left-0 right-0 z-10 h-16 border-t lg:relative lg:h-full lg:w-64 lg:border-t-0 lg:border-r">
      <div className="flex h-full items-center justify-around lg:flex-col lg:justify-start lg:p-4 lg:gap-4">
        <NavigationItem href="/" icon={<FontAwesomeIcon iconType="home" styleType="solid" />} text="ホーム" />
        <NavigationItem href="/search" icon={<FontAwesomeIcon iconType="search" styleType="solid" />} text="検索" />
        <NavigationItem
          href={activeUser ? "/dm" : undefined}
          command={!activeUser ? "show-modal" : undefined}
          commandfor={authModalId}
          icon={<FontAwesomeIcon iconType="envelope" styleType="solid" />}
          text="メッセージ"
        />
        <NavigationItem
          href={activeUser ? "/crok" : undefined}
          command={!activeUser ? "show-modal" : undefined}
          commandfor={authModalId}
          icon={<CrokLogo className="h-6 w-6" />}
          text="AIチャット"
        />
        <button
          popoverTarget={newPostModalId}
          className="bg-teal-700 text-white p-2 rounded-full lg:w-full lg:rounded-lg lg:font-bold"
        >
          投稿
        </button>
        {activeUser && (
          <NavigationItem
            href={`/users/${activeUser.username}`}
            icon={<FontAwesomeIcon iconType="user" styleType="solid" />}
            text="マイページ"
          />
        )}
        {!activeUser && (
          <button
            popoverTarget={authModalId}
            className="hidden lg:block w-full border border-teal-700 text-teal-700 rounded-lg p-2"
          >
            サインイン
          </button>
        )}
      </div>
    </nav>
  );
};
