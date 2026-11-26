#!/usr/bin/env node
// Builds the QA app into one page, the same way the Esto Care Operations app is built
// (tools/build.py there): everything inlined into a single HTML file.
//   app/dist/index.html    standalone page (open locally or host anywhere)
//   app/dist/artifact.html the same page without <html>/<head>, to publish as a Claude artifact
// The engine is NOT copied by hand: src/rules and src/qa are inlined, so the app always
// behaves exactly like the tested code (ADR-0008). Run: npm run build:app

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(join(root, p), "utf8");
const flatten = src => src
  .replace(/^\s*import[^;]*;\s*$/gm, "")
  .replace(/^export \* from[^;]*;\s*$/gm, "")
  .replace(/^export (const|let|function|class) /gm, "$1 ")
  .replace(/^export \{[^}]*\};?\s*$/gm, "");

const engineFiles = ["src/rules/dates.js", "src/rules/schedule.js", "src/rules/rag.js", "src/qa/schedule.js", "src/qa/access.js", "src/qa/alerts.js"];
const names = new Set();
for (const f of engineFiles) for (const m of read(f).matchAll(/^export (?:const|let|function|class) ([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
const engine = `const QA = (() => {\n${engineFiles.map(f => `// ---- ${f} ----\n${flatten(read(f))}`).join("\n")}\nreturn { ${[...names].join(", ")} };\n})();`;

const appFiles = ["core.js", "seed.js", "model.js", "views.js", "homes.js", "admin.js", "main.js"];
const bundle = [
  "/* Esto Care QA app. Built by app/build.mjs: edit app/js and src/, not this file. */",
  '"use strict";',
  "(function () {",
  `const QA_CONFIG = ${read("config/qa-modules.json").trim()};`,
  `const RULES_CONFIG = ${read("config/rules.json").trim()};`,
  engine,
  ...appFiles.map(f => `// ---- app/js/${f} ----\n${read("app/js/" + f)}`),
  "})();",
].join("\n\n");

const body = read("app/shell.html")
  .replace("/*STYLE*/", () => read("app/style.css"))
  .replace("/*BUNDLE*/", () => bundle.replace(/<\/script/g, "<\\/script"));

mkdirSync(join(root, "app/dist"), { recursive: true });
writeFileSync(join(root, "app/dist/artifact.html"), body);
writeFileSync(join(root, "app/dist/index.html"), `<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${body}\n</body>\n</html>\n`);
console.log(`Built app/dist/index.html (${(body.length / 1024).toFixed(0)} KB) and app/dist/artifact.html`);
