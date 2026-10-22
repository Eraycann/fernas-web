import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

for (const folder of ["projects", "news", "pages"]) {
  const files = await readdir(join("src/content", folder));
  let total = 0;
  let title = 0;
  let body = 0;
  const missing = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(await readFile(join("src/content", folder, file), "utf8"));
    total += 1;
    if (data.title_en && data.title_en.trim()) title += 1;
    else missing.push(`${file}: title`);
    if (data.body_html_en && data.body_html_en.trim()) body += 1;
    else missing.push(`${file}: body`);
  }
  console.log(folder, { total, title, body });
  console.log(missing.slice(0, 30).join("\n"));
}
