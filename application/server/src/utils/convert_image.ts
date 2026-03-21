import { spawn } from "child_process";

import piexif from "piexifjs";

export async function convertImage(input: Buffer): Promise<{ data: Buffer; alt: string }> {
  const comment = await identify(input);

  const jpeg = await convert(input);

  // comment があれば piexifjs で EXIF ImageDescription として書き込む (ImageMagick は ImageDescription を非標準の Comment に移してしまうため)
  if (!comment) {
    return { data: jpeg, alt: "" };
  }

  const binary = Array.from(jpeg)
    .map((b) => String.fromCharCode(b))
    .join("");
  const descriptionBinary = Array.from(new TextEncoder().encode(comment))
    .map((b) => String.fromCharCode(b))
    .join("");
  const exifStr = piexif.dump({ "0th": { [piexif.ImageIFD.ImageDescription]: descriptionBinary } });
  const outputWithExif = piexif.insert(exifStr, binary);
  const bytes = Buffer.from(outputWithExif.split("").map((c) => c.charCodeAt(0)));

  return { data: bytes, alt: comment };
}

function runCommand(cmd: string, args: string[], input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`${cmd} exited with code ${code}`));
      }
    });
    proc.stdin.end(input);
  });
}

async function identify(input: Buffer): Promise<string> {
  try {
    const buf = await runCommand("magick", ["identify", "-format", "%c", "-"], input);
    return buf.toString("utf-8").trim();
  } catch {
    // IMv6 fallback
    try {
      const buf = await runCommand("identify", ["-format", "%c", "-"], input);
      return buf.toString("utf-8").trim();
    } catch {
      return "";
    }
  }
}

async function convert(input: Buffer): Promise<Buffer> {
  try {
    return await runCommand("magick", ["-", "jpg:-"], input);
  } catch {
    // IMv6 fallback
    return await runCommand("convert", ["-", "jpg:-"], input);
  }
}
