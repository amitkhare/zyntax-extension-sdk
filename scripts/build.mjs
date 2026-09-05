import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(packageRoot, "dist");
if (dirname(distRoot) !== packageRoot) {
  throw new Error("Extension SDK output must remain inside the package root.");
}

await rm(distRoot, { recursive: true, force: true });

const require = createRequire(import.meta.url);
const typeScriptCli = require.resolve("typescript/bin/tsc");
await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn(process.execPath, [typeScriptCli, "-p", "./tsconfig.build.json"], {
    cwd: packageRoot,
    stdio: "inherit",
    windowsHide: true,
  });
  child.once("error", rejectPromise);
  child.once("exit", (code, signal) => {
    if (code === 0) resolvePromise();
    else rejectPromise(new Error(`TypeScript build failed (${signal ?? code}).`));
  });
});

await mkdir(distRoot, { recursive: true });
for (const file of [
  "capabilities.js",
  "capabilities.d.ts",
  "manifestConstants.js",
  "manifestConstants.d.ts",
]) {
  await cp(resolve(packageRoot, "src", file), resolve(distRoot, file));
}

const { EXTENSION_PROVIDER_METHODS } = await import("../dist/providerMethods.js");
const { EXTENSION_HOST_API_METHODS, EXTENSION_HOST_API_INTERACTIVE_METHODS } =
  await import("../dist/hostMethods.js");
await writeFile(resolve(distRoot, "runtime-contract.json"), JSON.stringify({
  providerMethods: EXTENSION_PROVIDER_METHODS,
  hostMethods: EXTENSION_HOST_API_METHODS,
  interactiveHostMethods: EXTENSION_HOST_API_INTERACTIVE_METHODS,
}, null, 2) + "\n");
