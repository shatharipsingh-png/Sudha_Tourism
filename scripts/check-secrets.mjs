import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const variables =
  "(DB_PASSWORD|JWT_SECRET|IP_SALT|SMTP_PASSWORD|ADMIN_PASSWORD|password|secret)";
export function scanAssignments(file, content) {
  const findings = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (/^\s*(?:#|\/\/|\*)/.test(line)) continue;
    const pattern = new RegExp(
      `["']?\\b${variables}["']?\\s*(?:=(?!=|>)|:)\\s*([^\\r\\n]+)`,
      "gi",
    );
    for (const match of line.matchAll(pattern)) {
      const raw = match[2].trim();
      const quoted = raw.match(/^(['"])(.*?)\1/);
      if (!quoted && /\.(?:js|jsx|mjs|json)$/.test(file)) continue;
      const value = quoted ? quoted[2] : raw.split(/[;,]/)[0].trim();
      const safe =
        !value ||
        /^(?:undefined|null|false|true|PLACEHOLDER)$/i.test(value) ||
        /^(?:<|\$|process\.env|values\.|env\.|req\.|body\.|options\.|config\.|randomBytes\(|randomUUID\(|z\.|String\(|get\(|generate|new |[a-zA-Z]+\.password)/.test(
          value,
        ) ||
        /placeholder|change.?me|replace|test.only/i.test(value);
      // Fixture credentials are not real accounts. Report them as such, without values.
      const fixture =
        /(^|\/)(test|tests)\//.test(file) ||
        file === "scripts/check-secrets.mjs";
      if (!safe)
        findings.push({
          file,
          line: index + 1,
          variable: match[1].toUpperCase(),
          classification: fixture
            ? "SAFE TEST FIXTURE"
            : "REVIEW / ROTATE IF REAL",
        });
    }
  }
  return findings;
}
function main() {
  const files = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8", windowsHide: true },
  )
    .split("\0")
    .filter(Boolean);
  const current = [];
  for (const file of files) {
    if (
      !/\.(?:js|jsx|mjs|json|md|txt|ya?ml|example)$/.test(file) &&
      !/\.env(?:\.|$)/.test(file)
    )
      continue;
    if (file.endsWith("package-lock.json")) continue;
    try {
      current.push(...scanAssignments(file, readFileSync(file, "utf8")));
    } catch {
      /* Removed or binary files are not source. */
    }
  }
  console.log(
    JSON.stringify(
      { scope: "tracked and Git-visible current files", findings: current },
      null,
      2,
    ),
  );
  if (process.argv.includes("--history")) {
    const findings = [];
    const commits = execFileSync("git", ["rev-list", "--all"], {
      encoding: "utf8",
      windowsHide: true,
    })
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (const commit of commits) {
      const paths = execFileSync(
        "git",
        ["ls-tree", "-r", "--name-only", commit],
        { encoding: "utf8", windowsHide: true },
      )
        .split("\n")
        .filter((file) => /\.env(?:\.|$)/.test(file));
      for (const file of paths) {
        const content = execFileSync("git", ["show", `${commit}:${file}`], {
          encoding: "utf8",
          windowsHide: true,
        });
        findings.push(
          ...scanAssignments(file, content)
            .filter((item) => item.classification !== "SAFE TEST FIXTURE")
            .map((item) => ({ ...item, commit: commit.slice(0, 12) })),
        );
      }
    }
    console.log(
      JSON.stringify(
        {
          scope: "environment files in all available Git commits",
          commitsChecked: commits.length,
          findings,
        },
        null,
        2,
      ),
    );
  }
  if (current.some((item) => item.classification === "REVIEW / ROTATE IF REAL"))
    process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
