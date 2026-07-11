import spawn from "bare-runtime/spawn";
import path from "node:path";
import os from "node:os";

const workerPath = path.resolve("node_modules/@qvac/sdk/dist/server/worker.js");
console.log("Worker Path:", workerPath);

try {
  const socketPath = `\\\\.\\pipe\\test-qvac-worker-pipe-${Date.now()}`;
  console.log("Socket Path:", socketPath);

  const proc = spawn("bare", {
    args: [
      workerPath,
      JSON.stringify({
        QVAC_IPC_SOCKET_PATH: socketPath,
        HOME_DIR: os.homedir()
      })
    ],
    platform: process.platform,
    arch: process.arch,
    stdio: ["pipe", "pipe", "pipe"]
  });

  console.log("Proc spawned. PID:", proc.pid);

  proc.stdout.on("data", (data) => {
    console.log("STDOUT:", data.toString());
  });

  proc.stderr.on("data", (data) => {
    console.log("STDERR:", data.toString());
  });

  proc.on("error", (err) => {
    console.error("Spawn Error:", err);
  });

  proc.on("exit", (code, signal) => {
    console.log(`Exited with code ${code}, signal ${signal}`);
  });

  // Keep alive for 5 seconds to capture logs
  setTimeout(() => {
    console.log("Killing proc...");
    proc.kill("SIGTERM");
  }, 5000);

} catch (err) {
  console.error("Catch Block Error:", err);
}
