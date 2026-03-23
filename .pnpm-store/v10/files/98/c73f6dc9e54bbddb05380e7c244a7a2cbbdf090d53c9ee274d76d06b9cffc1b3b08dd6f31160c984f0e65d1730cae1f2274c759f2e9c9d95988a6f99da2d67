import { a as JSONStringify, n as ArrayIsArray } from "./globals.js";
import { t as getErrorMessage } from "./utils.js";
async function loadJsConfigs(paths) {
	try {
		let results = await Promise.allSettled(paths.map(async (path) => {
			let config = (await import(new URL(`file://${path}`).href)).default;
			if (config === void 0) throw Error("Configuration file has no default export.");
			if (typeof config != "object" || !config || ArrayIsArray(config)) throw Error("Configuration file must have a default export that is an object.");
			return {
				path,
				config
			};
		})), successes = [], errors = [];
		for (let i = 0; i < results.length; i++) {
			let result = results[i];
			result.status === "fulfilled" ? successes.push(result.value) : errors.push({
				path: paths[i],
				error: getErrorMessage(result.reason)
			});
		}
		return errors.length > 0 ? JSONStringify({ Failures: errors }) : JSONStringify({ Success: successes });
	} catch (err) {
		return JSONStringify({ Error: getErrorMessage(err) });
	}
}
export { loadJsConfigs };
