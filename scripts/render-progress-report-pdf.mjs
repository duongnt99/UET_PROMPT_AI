import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const html = pathToFileURL(path.join(root, "docs/bao-cao-tien-do.html")).href;
const out = path.join(root, "docs/BAO_CAO_TIEN_DO_HE_THONG.pdf");

const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch(existsSync(systemChrome) ? { executablePath: systemChrome } : {});
const page = await browser.newPage();
await page.goto(html, { waitUntil: "load" });
await page.pdf({
  path: out,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;color:#6b7280;width:100%;padding:0 18mm;font-family:Arial,sans-serif;">AI Arena Viet Nam — Báo cáo hiện trạng và hướng dẫn hệ thống (nội bộ)</div>`,
  footerTemplate: `<div style="font-size:8px;color:#6b7280;width:100%;padding:0 18mm;font-family:Arial,sans-serif;display:flex;justify-content:space-between;"><span>07/09/2026</span><span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.info("Wrote", out);
