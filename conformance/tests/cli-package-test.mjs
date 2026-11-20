#!/usr/bin/env node
/**
 * cli-package-test.mjs — the published npm package must run its own CLI.
 *
 * Packs the package exactly as `npm publish` would, extracts the tarball
 * to a temp dir (dependencies linked from this checkout) and runs `tteop version` and
 * `tteop validate` from it. Guards two regressions shipped in
 * 0.1.6–0.1.8-draft: the CLI reported a stale hard-coded version, and
 * `validate` crashed because conformance/tteop-validate.mjs was not packed.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };

const tmp = mkdtempSync(join(tmpdir(), "tteop-pack-"));
try {
  const out = execFileSync("npm", ["pack", "--json", "--pack-destination", tmp], { cwd: ROOT, encoding: "utf8" });
  const info = JSON.parse(out)[0];
  const files = info.files.map((f) => f.path);
  check(files.includes("bin/tteop.mjs"), "tarball contains bin/tteop.mjs");
  check(files.includes("conformance/tteop-validate.mjs"), "tarball contains conformance/tteop-validate.mjs");
  check(files.includes("lib/envelope-validator.mjs"), "tarball contains lib/envelope-validator.mjs");

  execFileSync("tar", ["-xzf", join(tmp, info.filename), "-C", tmp]);
  // Dependencies come from this checkout, standing in for `npm install`.
  symlinkSync(join(ROOT, "node_modules"), join(tmp, "package", "node_modules"), "dir");
  const cli = join(tmp, "package", "bin", "tteop.mjs");

  const ver = spawnSync(process.execPath, [cli, "version"], { encoding: "utf8" });
  check(ver.status === 0 && ver.stdout.trim() === `tteop/${pkg.version}`,
    `tteop version prints tteop/${pkg.version} (got "${ver.stdout.trim()}")`);

  const record = execFileSync(process.execPath, [join(ROOT, "integrations", "cli", "example.mjs"),
    "--input", "1251211", "--output", "11296121", "--cache-write", "128196310", "--cache-read", "2555179769"],
    { cwd: ROOT, encoding: "utf8" });
  const payload = join(tmp, "record.json");
  writeFileSync(payload, record);
  const val = spawnSync(process.execPath, [cli, "validate", payload, "--report", "text"], { encoding: "utf8" });
  check(val.status === 0, `tteop validate runs from the packed tarball (exit ${val.status}${val.stderr ? ": " + val.stderr.split("\n")[0] : ""})`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll CLI package checks passed");
process.exit(failed ? 1 : 0);
