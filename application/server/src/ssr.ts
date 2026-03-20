export function renderAppShell(pathname: string): string {
  const heading = pathname.startsWith("/crok") ? "Crok" : "CaX";

  return `<main class="mx-auto max-w-2xl px-4 py-6"><h1 class="text-cax-text text-2xl font-bold">${heading}</h1><p class="text-cax-text-muted mt-2 text-sm">Loading...</p></main>`;
}
