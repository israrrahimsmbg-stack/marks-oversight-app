#!/usr/bin/env node
// Builds the clickable prototype into two single files:
//   prototype/dist/index.html    — standalone page (open locally, or serve on GitHub Pages)
//   prototype/dist/artifact.html — the same page without the <!doctype>/<html> wrapper,
//                                  for publishing as a Claude artifact
//
// The rules engine is NOT copied by hand: this script inlines src/rules/*.js and
// config/rules.json, so the prototype always shows exactly what the tested engine says
// (ADR-0008). Run: npm run build:prototype

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const read = p => readFileSync(join(root, p), "utf8");

/** Turn an ES module into plain script text: drop imports, unwrap exports. */
function flatten(src) {
  return src
    .replace(/^\s*import[^;]*;\s*$/gm, "")
    .replace(/^export \* from[^;]*;\s*$/gm, "")
    .replace(/^export (const|let|function|class) /gm, "$1 ")
    .replace(/^export \{[^}]*\};?\s*$/gm, "")
    .trim();
}

const engine = ["dates.js", "schedule.js", "rag.js", "escalation.js", "report.js"]
  .map(f => `// ---- src/rules/${f} ----\n${flatten(read(`src/rules/${f}`))}`)
  .join("\n\n");

const bundle = [
  "/* Mark's App prototype. Built by prototype/build.mjs — do not edit dist/ by hand. */",
  '"use strict";',
  "(function () {",
  `const RULES_CONFIG = ${read("config/rules.json").trim()};`,
  engine,
  `// ---- prototype/data/sample-data.js ----\n${flatten(read("prototype/data/sample-data.js"))}`,
  `// ---- prototype/app/app.js ----\n${flatten(read("prototype/app/app.js"))}`,
  "})();",
].join("\n\n");

const body = read("prototype/shell.html")
  .replace("/*STYLE*/", () => read("prototype/app/style.css"))
  .replace("/*BUNDLE*/", () => bundle);

mkdirSync(join(root, "prototype/dist"), { recursive: true });
writeFileSync(join(root, "prototype/dist/artifact.html"), body);
writeFileSync(
  join(root, "prototype/dist/index.html"),
  `<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${body}\n</body>\n</html>\n`
);

console.log(`Built prototype/dist/index.html (${(body.length / 1024).toFixed(0)} KB) and prototype/dist/artifact.html`);
