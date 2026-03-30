import { runShellCommand } from "./process";

export async function tinifyTheImage(path: string, output: string) {
  await runShellCommand(
    "magick", [path, "-resize", "480x", output]
  );
}

export async function extractAltFromMedia(path: string): Promise<string> {
  const exifJsonText = await runShellCommand(
    "exiftool", [
      "-ImageDescription",
      "-j",
      path
    ]
  );

  console.log(exifJsonText);

  return JSON.parse(exifJsonText)[0]["ImageDescription"];
}
