import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";

const workerPath = path.resolve("node_modules/@qvac/sdk/dist/server/worker.js");
const bin = "C:\\Users\\Acer\\Downloads\\Renaiss Pulse\\renaiss-pulse\\node_modules\\bare-runtime-win32-x64\\bin\\bare.exe";

const socketPath = `\\\\.\\pipe\\test-worker-debug-${Date.now()}`;
console.log("Spawning worker with socket:", socketPath);

const proc = spawn(bin, [
  workerPath,
  JSON.stringify({
    QVAC_IPC_SOCKET_PATH: socketPath,
    HOME_DIR: os.homedir()
  })
]);

proc.stdout.on("data", (data) => {
  console.log("WORKER STDOUT:", data.toString().trim());
});

proc.stderr.on("data", (data) => {
  console.log("WORKER STDERR:", data.toString().trim());
});

proc.on("error", (err) => {
  console.error("Worker Spawn Error:", err);
});

proc.on("exit", (code, signal) => {
  console.log(`Worker exited with code ${code}, signal ${signal}`);
});

// Wait 10 seconds, then exit
setTimeout(() => {
  console.log("Terminating worker...");
  proc.kill("SIGTERM");
  process.exit(0);
}, 10000);
