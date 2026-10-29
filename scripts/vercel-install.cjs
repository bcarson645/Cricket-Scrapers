/**
 * Vercel install: override Sportradar npm proxy (ENOTFOUND on cdproxy) and run npm ci.
 */
const fs = require("fs");
const { execSync } = require("child_process");

const REGISTRY = "https://registry.npmjs.org/";

function rewriteLockfileIfNeeded() {
  const path = "package-lock.json";
  let lock = fs.readFileSync(path, "utf8");
  if (!/cdproxy\.sportradar/i.test(lock)) return;
  lock = lock.replace(
    /https:\/\/cdproxy\.sportradar\.online\/npm\/([^/]+)\/-/g,
    (_, encoded) => `https://registry.npmjs.org/${decodeURIComponent(encoded)}/-/`,
  );
  fs.writeFileSync(path, lock);
  console.log("[vercel-install] Rewrote cdproxy URLs → registry.npmjs.org");
}

rewriteLockfileIfNeeded();

const env = {
  ...process.env,
  NPM_CONFIG_REGISTRY: REGISTRY,
  npm_config_registry: REGISTRY,
};

execSync(`npm ci --registry=${REGISTRY}`, { stdio: "inherit", env });
