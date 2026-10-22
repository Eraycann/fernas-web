import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await page.goto("http://127.0.0.1:4321/en/news/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const info = await page.evaluate(() => {
  const header = document.querySelector("header");
  const details = document.querySelector("details.mobile-menu");
  const panel = document.querySelector(".mobile-panel");
  const main = document.querySelector("main");
  const first = main?.firstElementChild;
  return {
    header: header?.getBoundingClientRect().toJSON(),
    headerBg: header ? getComputedStyle(header).backgroundColor : null,
    detailsOpen: details?.hasAttribute("open"),
    panel: panel?.getBoundingClientRect().toJSON(),
    panelDisplay: panel ? getComputedStyle(panel).display : null,
    panelBg: panel ? getComputedStyle(panel).backgroundColor : null,
    main: main?.getBoundingClientRect().toJSON(),
    first: first?.getBoundingClientRect().toJSON(),
    firstBg: first ? getComputedStyle(first).backgroundColor : null,
    scrollY: window.scrollY,
    html: header?.outerHTML.slice(0, 500),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "screenshots/qa/mobile-top.png", clip: { x: 0, y: 0, width: 390, height: 300 } });
await browser.close();
