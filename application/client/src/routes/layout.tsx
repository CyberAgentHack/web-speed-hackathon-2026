import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import {
	sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getLoaderContext } from "@web-speed-hackathon-2026/client/src/utils/server_fetch";
import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Outlet, useLoaderData, useLocation, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

const NewPostModalContainer = lazy(() =>
	import(
		"@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer"
	).then((m) => ({
		default: m.NewPostModalContainer,
	})),
);

export interface LayoutContext {
	activeUser: Models.User | null;
	setActiveUser: (user: Models.User | null) => void;
	authModalId: string;
}

export async function loader({ context }: LoaderFunctionArgs) {
	const ctx = getLoaderContext(context);
	const activeUser = await ctx.getMe() as Models.User | null;
	return { activeUser };
}

export default function Layout() {
	const location = useLocation();
	const navigate = useNavigate();
	const loaderData = useLoaderData<typeof loader>();

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll to top on route change
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location.pathname]);

	const [activeUser, setActiveUser] = useState<Models.User | null>(loaderData.activeUser);

	const handleLogout = useCallback(async () => {
		await sendJSON("/api/v1/signout", {});
		setActiveUser(null);
		navigate("/");
	}, [navigate]);

	const authModalId = useId();
	const newPostModalId = useId();

	const context: LayoutContext = { activeUser, setActiveUser, authModalId };

	return (
		<>
			<AppPage
				activeUser={activeUser}
				authModalId={authModalId}
				newPostModalId={newPostModalId}
				onLogout={handleLogout}
			>
				<Outlet context={context} />
			</AppPage>

			<AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
			<Suspense fallback={null}>
				<NewPostModalContainer id={newPostModalId} />
			</Suspense>
		</>
	);
}
