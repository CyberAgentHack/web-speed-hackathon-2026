import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_URL = "http://localhost:3000/";
const REPORT_DIR = path.resolve("reports/lighthouse");
const VALID_DEVICES = new Set(["mobile", "desktop"]);

function printHelp() {
  console.log(`Usage: pnpm run analyze:lighthouse -- --url <url> --device <mobile|desktop>

Options:
  --url <url>       URL to audit. Default: ${DEFAULT_URL}
  --device <name>   Either "mobile" or "desktop". Default: mobile
  --help            Show this help message
`);
}

function parseArgs(argv) {
  const options = {
    url: process.env["LIGHTHOUSE_URL"] ?? DEFAULT_URL,
    device: process.env["LIGHTHOUSE_DEVICE"] ?? "mobile",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--url") {
      options.url = argv[index + 1] ?? options.url;
      index += 1;
      continue;
    }

    if (arg === "--device") {
      options.device = argv[index + 1] ?? options.device;
      index += 1;
      continue;
    }

    if (!arg.startsWith("--") && options.url === DEFAULT_URL) {
      options.url = arg;
    }
  }

  if (!VALID_DEVICES.has(options.device)) {
    throw new Error(`Unsupported device "${options.device}". Use mobile or desktop.`);
  }

  return options;
}

function createSlug(urlText) {
  const url = new URL(urlText);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const pathSlug = pathname === "/" ? "home" : pathname.slice(1).replace(/[\/]+/g, "-");
  const querySlug = url.search
    .replace(/^\?/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const baseSlug = querySlug ? `${pathSlug}-${querySlug}` : pathSlug;
  const safeSlug = baseSlug.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

  return safeSlug || "page";
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Lighthouse exited with code ${code ?? "unknown"}.`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const slug = createSlug(options.url);
  const reportBasePath = path.join(REPORT_DIR, `${slug}.${options.device}`);
  const lighthouseArgs = [
    "exec",
    "lighthouse",
    options.url,
    "--chrome-flags=--headless=new",
    "--output=html",
    "--output=json",
    `--output-path=${reportBasePath}`,
  ];

  if (options.device === "desktop") {
    lighthouseArgs.push("--preset=desktop");
  }

  await mkdir(REPORT_DIR, { recursive: true });

  console.log(`Running Lighthouse for ${options.url} (${options.device})`);
  console.log(`Reports will be written to ${reportBasePath}.report.{html,json}`);

  await run("pnpm", lighthouseArgs);
}

await main();
