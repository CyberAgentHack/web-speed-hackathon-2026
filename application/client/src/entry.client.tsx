import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

declare global {
	var __BUILD_INFO__: {
		BUILD_DATE: string | undefined;
		COMMIT_HASH: string | undefined;
	};
}

window.__BUILD_INFO__ = {
	BUILD_DATE: process.env.BUILD_DATE,
	COMMIT_HASH: process.env.COMMIT_HASH,
};

startTransition(() => {
	hydrateRoot(document, <HydratedRouter />);
});
