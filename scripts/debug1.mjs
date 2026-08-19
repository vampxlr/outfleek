import { chromium } from "playwright";
import fs from "fs";
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto("http://localhost:3001/checkout", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(()=>{});
  await page.waitForTimeout(2000);
  const html = await page.content();
  fs.writeFileSync("scripts/checkout.html", html);
  const count = await page.locator('input[placeholder="01XXXXXXXXX"]').count();
  console.log("count:", count);
  const bodyText = await page.locator("body").innerText();
  console.log(bodyText.slice(0,500));
  await browser.close();
})();
