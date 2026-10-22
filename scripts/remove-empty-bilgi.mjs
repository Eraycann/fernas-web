import { readFile, writeFile } from "node:fs/promises";

const path = "src/data/bilgi-toplumu.json";
const data = JSON.parse(await readFile(path, "utf8"));
const marker = '<h2 id="bolum-4">Belgeler</h2>';
console.log("before", data.html.includes(marker), data.html.length);
data.html = data.html.replace(marker, "");
console.log("after", data.html.includes(marker), data.html.length);
await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
