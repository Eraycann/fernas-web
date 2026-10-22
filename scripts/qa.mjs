import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const base = process.env.QA_BASE ?? "http://127.0.0.1:4321";
const outDir = "screenshots/qa";
await mkdir(outDir, { recursive: true });

const pages = [
  ["home", "/"],
  ["memberships", "/grup/uyelikler/"],
  ["certificates", "/grup/kalite-belgeleri/"],
  ["policies", "/grup/politikalar/"],
  ["bilgi", "/grup/bilgi-toplumu/"],
  ["about", "/grup/hakkimizda/"],
  ["timeline", "/grup/tarihce/"],
  ["projects", "/projeler/"],
  ["project-detail", "/projeler/sinop-ayancik-devlet-yolu/"],
  ["news", "/haberler/"],
  ["contact", "/iletisim/"],
  ["career", "/kariyer/"],
  ["sustainability", "/surdurulebilirlik/"],
  ["kvkk", "/kvkk/"],
  ["search", "/arama/"],
  ["sector", "/sektorler/insaat/"],
  ["en-home", "/en/"],
  ["en-projects", "/en/projects/"],
  ["en-project-detail", "/en/projects/sinop-ayancik-devlet-yolu/"],
  ["en-about", "/en/about/"],
  ["en-news", "/en/news/"],
  ["en-contact", "/en/contact/"],
  ["en-career", "/en/career/"],
  ["en-sustainability", "/en/sustainability/"],
  ["en-policies", "/en/policies/"],
  ["en-privacy", "/en/privacy/"],
  ["en-search", "/en/search/"],
];

const widths = [390, 1280];
const browser = await chromium.launch();
const results = [];

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${page.url()} :: ${message.text()}`);
  });
  page.on("pageerror", (error) => pageErrors.push(`${page.url()} :: ${error.message}`));
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.url()} :: ${request.failure()?.errorText}`);
  });

  for (const [name, path] of pages) {
    const url = `${base}${path}`;
    consoleErrors.length = 0;
    pageErrors.length = 0;
    failedRequests.length = 0;

    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.addStyleTag({ content: "astro-dev-toolbar{display:none!important}" });
    await page.evaluate(async () => {
      const step = Math.max(window.innerHeight * 0.8, 500);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => ({
      title: document.title,
      lang: document.documentElement.lang,
      main: Boolean(document.querySelector("main#main")),
      h1: document.querySelector("h1")?.textContent?.trim().replace(/\s+/g, " ") ?? "",
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyHeight: document.body.scrollHeight,
    }));

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

    await page.screenshot({
      path: join(outDir, `${name}-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });

    results.push({
      name,
      path,
      width,
      status: response?.status() ?? 0,
      ...metrics,
      overflowX: metrics.scrollWidth > metrics.innerWidth + 1,
      axeViolations: axe.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.length,
        targets: violation.nodes.slice(0, 3).map((node) => node.target),
      })),
      consoleErrors: [...new Set(consoleErrors)],
      pageErrors: [...new Set(pageErrors)],
      failedRequests: [...new Set(failedRequests)],
    });
  }

  await context.close();
}

await browser.close();
await writeFile(join(outDir, "report.json"), JSON.stringify(results, null, 2), "utf8");

const bad = results.filter(
  (result) =>
    result.status !== 200 ||
    !result.main ||
    result.overflowX ||
    result.axeViolations.length > 0 ||
    result.consoleErrors.length > 0 ||
    result.pageErrors.length > 0,
);

console.log(`Checked ${results.length} page/width combinations.`);
console.log(`Issues on ${bad.length}.`);
for (const result of bad) {
  console.log(`\n${result.name} @ ${result.width} (${result.status})`);
  if (result.overflowX) console.log(`  overflow-x: ${result.scrollWidth} > ${result.innerWidth}`);
  for (const violation of result.axeViolations) {
    console.log(`  axe ${violation.id} (${violation.impact}, ${violation.nodes}): ${violation.targets.join(" | ")}`);
  }
  for (const error of result.consoleErrors) console.log(`  console: ${error}`);
  for (const error of result.pageErrors) console.log(`  pageerror: ${error}`);
}
