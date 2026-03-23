import { n as lint } from "./bindings.js";
let loadPlugin = null, setupRuleConfigs = null, lintFile = null, createWorkspace = null, destroyWorkspace = null, loadJsConfigs = null;
function loadPluginWrapper(path, pluginName, pluginNameIsAlias, workspaceUri) {
	return loadPlugin === null ? import("./plugins2.js").then((mod) => ({loadPlugin, lintFile, setupRuleConfigs} = mod, loadPlugin(path, pluginName, pluginNameIsAlias, workspaceUri))) : loadPlugin(path, pluginName, pluginNameIsAlias, workspaceUri);
}
function setupRuleConfigsWrapper(optionsJSON) {
	return setupRuleConfigs(optionsJSON);
}
function lintFileWrapper(filePath, bufferId, buffer, ruleIds, optionsIds, settingsJSON, globalsJSON, workspaceUri) {
	return lintFile(filePath, bufferId, buffer, ruleIds, optionsIds, settingsJSON, globalsJSON, workspaceUri);
}
function createWorkspaceWrapper(workspace) {
	return createWorkspace === null ? import("./workspace.js").then((mod) => ({createWorkspace, destroyWorkspace} = mod, createWorkspace(workspace))) : Promise.resolve(createWorkspace(workspace));
}
function destroyWorkspaceWrapper(workspace) {
	destroyWorkspace(workspace);
}
function loadJsConfigsWrapper(paths) {
	return loadJsConfigs === null ? import("./js_config.js").then((mod) => (loadJsConfigs = mod.loadJsConfigs, loadJsConfigs(paths))) : loadJsConfigs(paths);
}
await lint(process.argv.slice(2), loadPluginWrapper, setupRuleConfigsWrapper, lintFileWrapper, createWorkspaceWrapper, destroyWorkspaceWrapper, loadJsConfigsWrapper) || (process.exitCode = 1);
export {};
