const workspaces = /* @__PURE__ */ new Map();
let currentWorkspace = null, currentWorkspaceUri = null;
function createWorkspace(workspaceUri) {
	workspaces.set(workspaceUri, {
		cwd: "",
		allOptions: [],
		rules: []
	}), currentWorkspace = null, currentWorkspaceUri = null;
}
function destroyWorkspace(workspaceUri) {
	workspaces.delete(workspaceUri), currentWorkspaceUri === workspaceUri && (currentWorkspace = null, currentWorkspaceUri = null);
}
function setCurrentWorkspace(workspace, workspaceUri) {
	currentWorkspace = workspace, currentWorkspaceUri = workspaceUri;
}
export { setCurrentWorkspace as a, destroyWorkspace as i, currentWorkspace as n, workspaces as o, currentWorkspaceUri as r, createWorkspace as t };
