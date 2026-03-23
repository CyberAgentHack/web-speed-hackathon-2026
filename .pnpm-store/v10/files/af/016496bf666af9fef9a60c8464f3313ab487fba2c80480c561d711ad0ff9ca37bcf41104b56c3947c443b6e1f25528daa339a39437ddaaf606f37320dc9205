import "./globals.js";
import { a as loadPlugin, n as lintFile, u as setOptions } from "./lint.js";
import { t as getErrorMessage } from "./utils.js";
function setupRuleConfigs(optionsJSON) {
	try {
		return setOptions(optionsJSON), null;
	} catch (err) {
		return getErrorMessage(err);
	}
}
export { lintFile, loadPlugin, setupRuleConfigs };
