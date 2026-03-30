import childProcess from "node:child_process";

export function runShellCommand(exec: string, param: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = childProcess.spawn(exec, param);
    process.stdin.destroy();

    console.info(`i: \x1b[48;5;232m${[exec, ...param].join("\x1b[m \x1b[48;5;232m")}\x1b[m`)

    let stdout: string = "";
    let stderr: string = "";
    process.stdout.on("data", (payload: Buffer) => {
      stdout += payload.toString("utf-8");
    });

    process.stderr.on("data", (payload: Buffer) => {
      stderr += payload.toString("utf-8");
    });

    process.on("exit", (exit) => {
      if(exit === 0) {
        resolve(stdout);
      } else {
        console.error({ exit, data: stdout, stderr });
        reject({ exit, data: stdout, stderr });
      }
    });
  });
}

