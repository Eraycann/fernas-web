import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = "src";
const replacements = [
  ["text-white/45", "text-white/70"],
  ["text-white/50", "text-white/75"],
  ["text-white/55", "text-white/75"],
  ["text-white/60", "text-white/80"],
  ["text-white/65", "text-white/80"],
];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!entry.name.endsWith(".astro")) continue;
    let content = await readFile(path, "utf8");
    let next = content;
    for (const [from, to] of replacements) next = next.split(from).join(to);
    if (next !== content) {
      await writeFile(path, next, "utf8");
      console.log("updated", path);
    }
  }
}

await walk(root);
