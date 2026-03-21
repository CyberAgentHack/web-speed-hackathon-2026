import { AccountMenu } from "@web-speed-hackathon-2026/client/src/components/application/AccountMenu";
import {
  NavigationItem,
  NavigationItemButton,
} from "@web-speed-hackathon-2026/client/src/components/application/NavigationItem";
import { DirectMessageNotificationBadge } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageNotificationBadge";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { AUTH_MODAL_ID, NEW_POST_MODAL_ID } from "../../utils/constants";
import { useCallback } from "react";
import { sendJSON } from "../../utils/fetchers";
import { useQuery } from "@tanstack/react-query";
import { authQueryOptions } from "../../query/auth";
import { useNavigate } from "@tanstack/react-router";
import { NewPostModalContainer } from "../../containers/NewPostModalContainer";
import { AuthModalContainer } from "../../containers/AuthModalContainer";

export const Navigation = () => {
  const { data: activeUser, refetch } = useQuery(authQueryOptions);

  const navigate = useNavigate();
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    refetch();
  }, [navigate]);

  return (
    <>
      <nav className="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r">
        <div className="relative grid grid-flow-col items-center justify-evenly lg:fixed lg:flex lg:h-full lg:w-48 lg:flex-col lg:justify-between lg:p-2">
          <ul className="grid grid-flow-col items-center justify-evenly lg:grid-flow-row lg:auto-rows-min lg:justify-start lg:gap-2">
            <NavigationItem
              to="/"
              icon={
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 576 512"
                  fill="currentColor"
                  className="my-[3px]"
                >
                  <path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"></path>
                </svg>
              }
              text="ホーム"
            />
            <NavigationItem
              to="/search"
              icon={
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  className="my-[3px]"
                >
                  <path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path>
                </svg>
              }
              text="検索"
            />
            {activeUser != null ? (
              <NavigationItem
                badge={<DirectMessageNotificationBadge />}
                to="/dm"
                icon={
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                    className="my-[3px]"
                  >
                    <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path>
                  </svg>
                }
                text="DM"
              />
            ) : null}
            {activeUser != null ? (
              <NavigationItemButton
                icon={
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 576 512"
                    fill="currentColor"
                    className="my-[3px]"
                  >
                    <path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path>
                  </svg>
                }
                command="show-modal"
                commandfor={NEW_POST_MODAL_ID}
                text="投稿する"
              />
            ) : null}
            {activeUser != null ? (
              <NavigationItem
                to="/users/$username"
                // @ts-expect-error
                params={{ username: activeUser.username }}
                icon={
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 448 512"
                    fill="currentColor"
                    className="my-[3px]"
                  >
                    <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path>
                  </svg>
                }
                text="マイページ"
              />
            ) : null}
            {activeUser == null ? (
              <NavigationItemButton
                icon={
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                    className="my-[3px]"
                  >
                    <path d="M416 448h-84c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h84c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32h-84c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h84c53 0 96 43 96 96v192c0 53-43 96-96 96zm-47-201L201 79c-15-15-41-4.5-41 17v96H24c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24h136v96c0 21.5 26 32 41 17l168-168c9.3-9.4 9.3-24.6 0-34z"></path>
                  </svg>
                }
                text="サインイン"
                command="show-modal"
                commandfor={AUTH_MODAL_ID}
              />
            ) : null}
            {activeUser != null ? (
              <NavigationItem
                to="/crok"
                icon={<CrokLogo className="h-[30px] w-[30px]" />}
                text="Crok"
              />
            ) : null}
            <NavigationItem
              to="/terms"
              icon={
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 640 512"
                  fill="currentColor"
                  className="my-[3px]"
                >
                  <path d="M256 336h-.02c0-16.18 1.34-8.73-85.05-181.51-17.65-35.29-68.19-35.36-85.87 0C-2.06 328.75.02 320.33.02 336H0c0 44.18 57.31 80 128 80s128-35.82 128-80zM128 176l72 144H56l72-144zm511.98 160c0-16.18 1.34-8.73-85.05-181.51-17.65-35.29-68.19-35.36-85.87 0-87.12 174.26-85.04 165.84-85.04 181.51H384c0 44.18 57.31 80 128 80s128-35.82 128-80h-.02zM440 320l72-144 72 144H440zm88 128H352V153.25c23.51-10.29 41.16-31.48 46.39-57.25H528c8.84 0 16-7.16 16-16V48c0-8.84-7.16-16-16-16H383.64C369.04 12.68 346.09 0 320 0s-49.04 12.68-63.64 32H112c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h129.61c5.23 25.76 22.87 46.96 46.39 57.25V448H112c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h416c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"></path>
                </svg>
              }
              text="利用規約"
            />
          </ul>

          {activeUser != null ? (
            <AccountMenu user={activeUser} onLogout={handleLogout} />
          ) : null}
        </div>
      </nav>
      <NewPostModalContainer />
      <AuthModalContainer onUpdateActiveUser={() => refetch()} />
    </>
  );
};
