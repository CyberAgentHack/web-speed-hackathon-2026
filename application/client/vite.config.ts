import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	plugins: [
		tailwindcss(),
		reactRouter(),
		viteStaticCopy({
			targets: [
				{
					src: "node_modules/katex/dist/fonts/*",
					dest: "styles/fonts",
				},
			],
		}),
	],
	resolve: {
		alias: {
			"@web-speed-hackathon-2026/client": path.resolve(__dirname, "."),
			"bayesian-bm25$": path.resolve(
				__dirname,
				"node_modules/bayesian-bm25/dist/index.js",
			),
			kuromoji$: path.resolve(
				__dirname,
				"node_modules/kuromoji/build/kuromoji.js",
			),
		},
	},
	define: {
		"process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
		"process.env.COMMIT_HASH": JSON.stringify(process.env.SOURCE_VERSION || ""),
		"process.env.NODE_ENV": JSON.stringify(
			process.env.NODE_ENV || "production",
		),
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						if (/kuromoji|negaposi|bayesian-bm25/.test(id)) {
							return "nlp";
						}
					}
				},
			},
		},
	},
	ssr: {
		noExternal: true,
	},
});
