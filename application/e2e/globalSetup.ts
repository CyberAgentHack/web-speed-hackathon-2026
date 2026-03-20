async function globalSetup() {
  const baseUrl = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/initialize`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Failed to initialize: ${res.status} ${res.statusText}`);
  }
}

export default globalSetup;
