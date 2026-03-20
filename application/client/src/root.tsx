import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import "./index.css";

export function HydrateFallback() {
	return null;
}

export default function Root() {
	return (
		<html lang="ja">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<Meta />
				<Links />
			</head>
			<body className="bg-cax-canvas text-cax-text">
				<Outlet />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
