import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequestHandler } from "@react-router/express";
import {
	PUBLIC_PATH,
	UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { createLoaderContext } from "@web-speed-hackathon-2026/server/src/loader_context";
import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { imageOptimizerRouter } from "@web-speed-hackathon-2026/server/src/routes/image_optimizer";
import { movieOptimizerRouter } from "@web-speed-hackathon-2026/server/src/routes/movie_optimizer";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";
import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";
import serveStatic from "serve-static";

export const app = Express();

app.set("trust proxy", true);

app.use(
	compression({
		filter: (req, res) => {
			if (req.headers.accept === "text/event-stream") {
				return false;
			}
			return compression.filter(req, res);
		},
	}),
);
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use(
	"/api/v1",
	(_req, res, next) => {
		res.header({
			"Cache-Control": "no-cache, no-transform",
		});
		return next();
	},
	apiRouter,
);
app.use(imageOptimizerRouter);
app.use(movieOptimizerRouter);

app.use(
	serveStatic(UPLOAD_PATH, {
		etag: true,
		lastModified: true,
		maxAge: "1d",
	}),
);

app.use(
	serveStatic(PUBLIC_PATH, {
		etag: true,
		lastModified: true,
		maxAge: "1d",
	}),
);

const CLIENT_BUILD_PATH = path.resolve(
	import.meta.dirname,
	"../../client/build/client",
);

app.use(
	serveStatic(CLIENT_BUILD_PATH, {
		etag: true,
		lastModified: true,
		setHeaders(res, filePath) {
			if (filePath.includes("/assets/")) {
				res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
			}
		},
	}),
);

// biome-ignore lint/suspicious/noExplicitAny: dynamic import type not available
const build = () => import("../../client/build/server/index.js") as any;

// Load CSS for inlining at startup
let inlineCssMap: Map<string, string> | null = null;
async function loadCssForInlining() {
	if (inlineCssMap) return inlineCssMap;
	inlineCssMap = new Map();
	const assetsDir = path.join(CLIENT_BUILD_PATH, "assets");
	try {
		const files = await fs.readdir(assetsDir);
		for (const file of files) {
			if (file.endsWith(".css")) {
				const content = await fs.readFile(path.join(assetsDir, file), "utf-8");
				inlineCssMap.set(`/assets/${file}`, content);
			}
		}
	} catch {
		// ignore
	}
	return inlineCssMap;
}
loadCssForInlining();

const rrHandler = createRequestHandler({
	build,
	getLoadContext(req) {
		return createLoaderContext(req);
	},
});

app.all("/{*path}", async (req, res, next) => {
	const cssMap = await loadCssForInlining();
	if (cssMap.size === 0) {
		return rrHandler(req, res, next);
	}

	const origWrite = res.write.bind(res);
	const origEnd = res.end.bind(res);
	const chunks: Buffer[] = [];

	// biome-ignore lint/suspicious/noExplicitAny: override types
	res.write = function (chunk: any, ...args: any[]) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		return true;
	} as any;

	// biome-ignore lint/suspicious/noExplicitAny: override types
	res.end = function (chunk?: any, ...args: any[]) {
		if (chunk) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		let html = Buffer.concat(chunks).toString("utf-8");

		if (res.getHeader("content-type")?.toString().includes("text/html")) {
			for (const [href, css] of cssMap) {
				const linkPattern = new RegExp(
					`<link[^>]*href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`,
					"g",
				);
				html = html.replace(linkPattern, `<style>${css}</style>`);
			}
		}

		res.removeHeader("content-length");
		origEnd(html);
	} as any;

	return rrHandler(req, res, next);
});
