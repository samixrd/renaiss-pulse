import { createServer } from "node:net";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Create a named pipe path
const pipeName = `test-pipe-${Date.now()}`;
const pipePath = `\\\\.\\pipe\\${pipeName}`;
console.log("Creating pipe at:", pipePath);

// Write a small script for Bare to execute
const bareScriptContent = `
const net = require('bare-net');
const pipePath = ${JSON.stringify(pipePath)};

console.log('Bare: Connecting to pipe:', pipePath);
try {
  const socket = net.connect(pipePath);
  
  socket.on('connect', () => {
    console.log('Bare: Connected successfully!');
    socket.write('Hello from Bare!');
    socket.end();
  });

  socket.on('error', (err) => {
    console.error('Bare Error event:', err.message, err.stack);
  });

  socket.on('close', () => {
    console.log('Bare: Socket closed');
  });
} catch (err) {
  console.error('Bare Catch block error:', err.message, err.stack);
}
`;

fs.writeFileSync("test-bare-client.js", bareScriptContent);
console.log("Wrote test-bare-client.js");

const server = createServer((socket) => {
  console.log("Server: Client connected!");
  socket.on("data", (data) => {
    console.log("Server received:", data.toString());
  });
  socket.on("end", () => {
    console.log("Server: Client disconnected");
    server.close();
    process.exit(0);
  });
});

server.listen(pipePath, () => {
  console.log("Server is listening. Spawning bare...");

  const bin = "C:\\Users\\Acer\\Downloads\\Renaiss Pulse\\renaiss-pulse\\node_modules\\bare-runtime-win32-x64\\bin\\bare.exe";
  const proc = spawn(bin, ["test-bare-client.js"]);

  proc.stdout.on("data", (data) => {
    console.log("BARE STDOUT:", data.toString().trim());
  });

  proc.stderr.on("data", (data) => {
    console.log("BARE STDERR:", data.toString().trim());
  });

  proc.on("exit", (code, signal) => {
    console.log(`Bare process exited with code ${code}, signal ${signal}`);
    setTimeout(() => {
      server.close();
      process.exit(1);
    }, 1000);
  });
});
