#!/usr/bin/env node
/**
 * Fail CI/Vercel builds if lockfile still references Sportradar npm proxy.
 */
const fs = require("fs");

const lock = fs.readFileSync("package-lock.json", "utf8");
if (/cdproxy\.sportradar/i.test(lock)) {
  console.error(
    "package-lock.json must use registry.npmjs.org, not cdproxy.sportradar.online",
  );
  process.exit(1);
}
