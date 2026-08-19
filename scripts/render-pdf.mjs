import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { resolve } from "path";
const br = await chromium.launch();
const page = await br.newPage();
const url = pathToFileURL(resolve("docs/LAB-REPORT.html")).href;
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(4000);                 // let images decode
await page.emulateMedia({ media: "print" });     // use the academic print stylesheet
await page.waitForTimeout(1500);
await page.pdf({
  path: "docs/LAB-REPORT.pdf",
  format: "A4",
  printBackground: true,
  margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: '<div style="width:100%;font-size:9px;color:#555;text-align:center;font-family:Georgia,serif;padding-top:4px;"><span class="pageNumber"></span></div>',
});
await br.close();
console.log("PDF written");
