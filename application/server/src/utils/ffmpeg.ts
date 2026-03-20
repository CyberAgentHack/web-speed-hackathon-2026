import { spawn } from "node:child_process";

export async function runFfmpeg(args: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const process = spawn("ffmpeg", args, {
            stdio: ["ignore", "inherit", "pipe"],
        });

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
                new Error(`ffmpeg failed with exit code ${code}: ${stderr}`),
            );
        });
    });
}
