import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
const AuthModalContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then(
        (module) => ({
            default: module.AuthModalContainer,
        }),
    ),
);
const NewPostModalContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then(
        (module) => ({
            default: module.NewPostModalContainer,
        }),
    ),
);
import {
    fetchJSON,
    sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const CrokContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then(
        (module) => ({ default: module.CrokContainer }),
    ),
);
const DirectMessageContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(
        (module) => ({ default: module.DirectMessageContainer }),
    ),
);
const DirectMessageListContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
        (module) => ({ default: module.DirectMessageListContainer }),
    ),
);
const NotFoundContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then(
        (module) => ({ default: module.NotFoundContainer }),
    ),
);
const PostContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then(
        (module) => ({ default: module.PostContainer }),
    ),
);
const SearchContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then(
        (module) => ({ default: module.SearchContainer }),
    ),
);
const TermContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then(
        (module) => ({ default: module.TermContainer }),
    ),
);
const TimelineContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then(
        (module) => ({ default: module.TimelineContainer }),
    ),
);
const UserProfileContainer = lazy(() =>
    import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(
        (module) => ({ default: module.UserProfileContainer }),
    ),
);

export const AppContainer = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    const [activeUser, setActiveUser] = useState<Models.User | null>(null);
    useEffect(() => {
        let isActive = true;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let idleId: number | null = null;

        const loadMe = () => {
            void fetchJSON<Models.User>("/api/v1/me")
                .then((user) => {
                    if (isActive) {
                        setActiveUser(user);
                    }
                })
                .catch(() => {
                    if (isActive) {
                        setActiveUser(null);
                    }
                });
        };

        const requestIdleCallback = window.requestIdleCallback?.bind(window);
        const cancelIdleCallback = window.cancelIdleCallback?.bind(window);

        if (requestIdleCallback !== undefined) {
            idleId = requestIdleCallback(
                () => {
                    loadMe();
                },
                { timeout: 2000 },
            );
        } else {
            timeoutId = setTimeout(loadMe, 1200);
        }

        return () => {
            isActive = false;
            if (idleId !== null && cancelIdleCallback !== undefined) {
                cancelIdleCallback(idleId);
            }
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
        };
    }, [setActiveUser]);
    const handleLogout = useCallback(async () => {
        await sendJSON("/api/v1/signout", {});
        setActiveUser(null);
        navigate("/");
    }, [navigate]);

    const authModalId = useId();
    const newPostModalId = useId();

    return (
        <>
            <AppPage
                activeUser={activeUser}
                authModalId={authModalId}
                newPostModalId={newPostModalId}
                onLogout={handleLogout}
            >
                <Suspense
                    fallback={
                        <div className="p-4 text-center text-gray-500">
                            Loading...
                        </div>
                    }
                >
                    <Routes>
                        <Route element={<TimelineContainer />} path="/" />
                        <Route
                            element={
                                <DirectMessageListContainer
                                    activeUser={activeUser}
                                    authModalId={authModalId}
                                />
                            }
                            path="/dm"
                        />
                        <Route
                            element={
                                <DirectMessageContainer
                                    activeUser={activeUser}
                                    authModalId={authModalId}
                                />
                            }
                            path="/dm/:conversationId"
                        />
                        <Route element={<SearchContainer />} path="/search" />
                        <Route
                            element={<UserProfileContainer />}
                            path="/users/:username"
                        />
                        <Route
                            element={<PostContainer />}
                            path="/posts/:postId"
                        />
                        <Route element={<TermContainer />} path="/terms" />
                        <Route
                            element={
                                <CrokContainer
                                    activeUser={activeUser}
                                    authModalId={authModalId}
                                />
                            }
                            path="/crok"
                        />
                        <Route element={<NotFoundContainer />} path="*" />
                    </Routes>
                </Suspense>
            </AppPage>

            <Suspense fallback={null}>
                <AuthModalContainer
                    id={authModalId}
                    onUpdateActiveUser={setActiveUser}
                />
                <NewPostModalContainer id={newPostModalId} />
            </Suspense>
        </>
    );
};
