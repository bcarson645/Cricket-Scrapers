const { execSync, spawn } = require("child_process");
const net = require("net");

const PORT = 3000;

function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port, "127.0.0.1");
  });
}

function killPortWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[1]?.includes(`:${port}`)) {
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

async function main() {
  if (await portInUse(PORT)) {
    killPortWindows(PORT);
    await new Promise((r) => setTimeout(r, 500));
  }

  const child = spawn("npx", ["next", "dev", "--webpack", "-p", String(PORT)], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

main();
