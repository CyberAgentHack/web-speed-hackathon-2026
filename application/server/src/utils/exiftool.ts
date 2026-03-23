import { spawn } from "node:child_process";

export async function copyMetadataWithExiftool(
    sourcePath: string,
    targetPath: string,
): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const process = spawn("exiftool", [
            "-overwrite_original",
            "-TagsFromFile",
            sourcePath,
            "-all:all",
            targetPath,
        ]);

        let stderr = "";

        process.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        process.on("error", (error) => {
            reject(error);
        });

        process.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(
                new Error(`exiftool failed with exit code ${code}: ${stderr}`),
            );
        });
    });
}

export async function getImageDimensions(
    filePath: string,
): Promise<{ width: number | null; height: number | null }> {
    const output = await new Promise<string>((resolve, reject) => {
        const process = spawn("exiftool", [
            "-j",
            "-ImageWidth",
            "-ImageHeight",
            filePath,
        ]);

        let stdout = "";
        let stderr = "";

        process.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });
        process.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        process.on("error", reject);
        process.on("close", (code) => {
            if (code === 0) {
                resolve(stdout);
                return;
            }
            reject(
                new Error(`exiftool failed with exit code ${code}: ${stderr}`),
            );
        });
    });

    const [metadata = {}] = JSON.parse(output) as Array<
        Record<string, unknown>
    >;
    const rawWidth = metadata["ImageWidth"];
    const rawHeight = metadata["ImageHeight"];

    return {
        width:
            typeof rawWidth === "number" && Number.isFinite(rawWidth)
                ? rawWidth
                : null,
        height:
            typeof rawHeight === "number" && Number.isFinite(rawHeight)
                ? rawHeight
                : null,
    };
}
