import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3001";
const OUT = path.resolve("docs/screenshots");
fs.mkdirSync(OUT, { recursive: true });
const ADMIN_PASSWORD = "luxe-admin-2026";

let orderNo = null;

async function closeDrawerIfOpen(p) {
  const closeBtn = p.locator('aside[aria-label="Shopping cart"] button[aria-label="Close"]');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
    await p.waitForTimeout(500);
  }
}


async function shot(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}: ${e?.message?.split("\n")[0] ?? e}`);
  }
}

async function settle(page, selector, timeout = 15000) {
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {});
  if (selector) await page.waitForSelector(selector, { timeout }).catch(() => {});
  await page.waitForTimeout(1500);
}

(async () => {
  const browser = await chromium.launch();
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await desktopCtx.newPage();
  const mpage = await mobileCtx.newPage();

  // 01 home listing
  await shot("01-home-listing.png", async () => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await page.screenshot({ path: path.join(OUT, "01-home-listing.png"), fullPage: true });
  });

  // 02 home mobile
  await shot("02-home-mobile.png", async () => {
    await mpage.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await settle(mpage, "main");
    await mpage.screenshot({ path: path.join(OUT, "02-home-mobile.png"), fullPage: true });
  });

  // find first product slug
  let firstSlug = null;
  await shot("03-product-detail.png", async () => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await settle(page, "main article a");
    const href = await page.locator('main a[href^="/product/"]').first().getAttribute("href");
    firstSlug = href;
    await page.goto(BASE + firstSlug, { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await page.screenshot({ path: path.join(OUT, "03-product-detail.png"), fullPage: true });
  });

  // 04 cart drawer
  await shot("04-cart-drawer.png", async () => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await settle(page, "main article");
    const card = page.locator("main article").first();
    await card.hover();
    await card.getByRole("button", { name: "Add to Cart" }).click();
    await page.waitForSelector('aside[aria-label="Shopping cart"]', { timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, "04-cart-drawer.png") });
    // drawerOpen persists to localStorage; close it so it doesn't block subsequent steps
    const closeBtn = page.locator('aside[aria-label="Shopping cart"] button[aria-label="Close"]');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  });

  // add a second item then go to cart page
  await shot("05-cart-page.png", async () => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await settle(page, "main article");
    const preClose = page.locator('aside[aria-label="Shopping cart"] button[aria-label="Close"]');
    if (await preClose.isVisible().catch(() => false)) {
      await preClose.click();
      await page.waitForTimeout(500);
    }
    const cards = page.locator("main article");
    const count = await cards.count();
    for (let i = 0; i < Math.min(2, count); i++) {
      const card = cards.nth(i);
      await card.hover();
      await card.getByRole("button", { name: "Add to Cart" }).click();
      await page.waitForSelector('aside[aria-label="Shopping cart"]', { timeout: 10000 });
      await page.waitForTimeout(400);
    }
    // drawerOpen is persisted to localStorage — explicitly close it so it doesn't
    // stay open over subsequent page loads (checkout, etc).
    const closeBtn = page.locator('aside[aria-label="Shopping cart"] button[aria-label="Close"]');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
    await page.goto(BASE + "/cart", { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await page.screenshot({ path: path.join(OUT, "05-cart-page.png"), fullPage: true });
  });

  // 06 checkout form
  await shot("06-checkout-form.png", async () => {
    await page.goto(BASE + "/checkout", { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await closeDrawerIfOpen(page);
    await page.screenshot({ path: path.join(OUT, "06-checkout-form.png"), fullPage: true });
  });

  // 07 checkout validation error
  await shot("07-checkout-validation-error.png", async () => {
    await page.goto(BASE + "/checkout", { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await closeDrawerIfOpen(page);
    const phoneInput = page.getByPlaceholder("01XXXXXXXXX").first();
    await phoneInput.fill("01123456789");
    await phoneInput.blur();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, "07-checkout-validation-error.png") });
  });

  // 08 checkout bkash
  await shot("08-checkout-bkash.png", async () => {
    await page.goto(BASE + "/checkout", { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await closeDrawerIfOpen(page);
    await page.getByRole("button", { name: /bKash/ }).click();
    await page.waitForSelector('input[placeholder="e.g. 9H7XXXXXXX"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, "08-checkout-bkash.png") });
  });

  // 09 order success — complete a real order
  await shot("09-order-success.png", async () => {
    await page.goto(BASE + "/checkout", { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await closeDrawerIfOpen(page);
    await page.getByPlaceholder("Your name").fill("Test Student");
    await page.getByPlaceholder("01XXXXXXXXX").first().fill("01712345678");
    await page.getByPlaceholder("House, road, area, district").fill("House 1, Road 2, Dhanmondi, Dhaka");
    await page.getByRole("button", { name: "Inside Dhaka" }).click();
    await page.getByRole("button", { name: /Cash on Delivery/ }).click();
    await page.getByRole("button", { name: /Place Order/ }).click();
    await page.waitForSelector("text=Order Confirmed", { timeout: 20000 });
    await page.waitForTimeout(1500);
    const orderText = await page.locator("text=/#[A-Za-z0-9-]+/").first().textContent();
    orderNo = orderText?.replace("#", "").trim();
    console.log("ORDER NUMBER:", orderNo);
    await page.screenshot({ path: path.join(OUT, "09-order-success.png") });
  });

  // 10 track order
  await shot("10-track-order.png", async () => {
    if (!orderNo) throw new Error("no orderNo captured");
    await page.goto(BASE + "/track", { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await page.getByPlaceholder("ORDER NO (LX-...)").fill(orderNo);
    await page.getByPlaceholder("PHONE (01XXXXXXXXX)").fill("01712345678");
    await page.getByRole("button", { name: "Track" }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, "10-track-order.png"), fullPage: true });
  });

  // 11 landing page
  await shot("11-landing-page.png", async () => {
    await page.goto(BASE + "/l/noir-bloom-offer", { waitUntil: "domcontentloaded" });
    await settle(page, "body");
    await page.screenshot({ path: path.join(OUT, "11-landing-page.png"), fullPage: true });
  });

  // 12 landing order form
  await shot("12-landing-order-form.png", async () => {
    await page.goto(BASE + "/l/noir-bloom-offer", { waitUntil: "domcontentloaded" });
    await settle(page, "#order", 20000);
    await page.locator("#order").scrollIntoViewIfNeeded({ timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, "12-landing-order-form.png") });
  });

  // 13 admin login (before login) — fresh context, no localStorage token
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const apage = await adminCtx.newPage();
  apage.on("dialog", (d) => d.dismiss().catch(() => {}));
  await shot("13-admin-login.png", async () => {
    await apage.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
    await settle(apage, "form");
    await apage.screenshot({ path: path.join(OUT, "13-admin-login.png") });
  });

  // login
  await shot("14-admin-dashboard.png", async () => {
    await apage.getByPlaceholder("Password").fill(ADMIN_PASSWORD);
    await apage.getByRole("button", { name: "Sign in" }).click();
    await apage.waitForSelector("text=Dashboard", { timeout: 15000 });
    await settle(apage, "main");
    await apage.screenshot({ path: path.join(OUT, "14-admin-dashboard.png"), fullPage: true });
  });

  // 15 admin orders
  let orderRowClicked = false;
  await shot("15-admin-orders.png", async () => {
    await apage.goto(BASE + "/admin/orders", { waitUntil: "domcontentloaded" });
    await settle(apage, "table");
    await apage.screenshot({ path: path.join(OUT, "15-admin-orders.png"), fullPage: true });
  });

  // 16 admin order detail
  await shot("16-admin-order-detail.png", async () => {
    const row = orderNo
      ? apage.locator("tr").filter({ hasText: orderNo }).first()
      : apage.locator("tbody tr").first();
    await row.click();
    orderRowClicked = true;
    await apage.waitForTimeout(1500);
    await apage.screenshot({ path: path.join(OUT, "16-admin-order-detail.png"), fullPage: true });
  });

  // 17 admin products
  await shot("17-admin-products.png", async () => {
    await apage.goto(BASE + "/admin/products", { waitUntil: "domcontentloaded" });
    await settle(apage, "table");
    await apage.screenshot({ path: path.join(OUT, "17-admin-products.png"), fullPage: true });
  });

  // 18 admin product form
  await shot("18-admin-product-form.png", async () => {
    await apage.getByRole("button", { name: "+ New product" }).click();
    await apage.waitForTimeout(1500);
    await apage.screenshot({ path: path.join(OUT, "18-admin-product-form.png"), fullPage: true });
  });

  // 19 admin landing list
  let landingId = null;
  await shot("19-admin-landing-list.png", async () => {
    await apage.goto(BASE + "/admin/landing", { waitUntil: "domcontentloaded" });
    await settle(apage, "table");
    await apage.screenshot({ path: path.join(OUT, "19-admin-landing-list.png"), fullPage: true });
  });

  // 20 admin landing builder
  await shot("20-admin-landing-builder.png", async () => {
    const row = apage.locator("tbody tr", { hasText: "noir-bloom-offer" }).first();
    const editLink = row.locator('a:has-text("Edit")');
    const href = await editLink.getAttribute("href");
    landingId = href;
    await apage.goto(BASE + href, { waitUntil: "domcontentloaded" });
    await settle(apage, "main");
    await apage.screenshot({ path: path.join(OUT, "20-admin-landing-builder.png"), fullPage: true });
  });

  // 21 admin settings
  await shot("21-admin-settings.png", async () => {
    await apage.goto(BASE + "/admin/settings", { waitUntil: "domcontentloaded" });
    await settle(apage, "main");
    await apage.screenshot({ path: path.join(OUT, "21-admin-settings.png"), fullPage: true });
  });

  // 22 admin tracking debug
  await shot("22-admin-tracking-debug.png", async () => {
    await apage.goto(BASE + "/admin/tracking", { waitUntil: "domcontentloaded" });
    await settle(apage, "main");
    await apage.screenshot({ path: path.join(OUT, "22-admin-tracking-debug.png"), fullPage: true });
  });

  await browser.close();
  console.log("DONE. Order number:", orderNo);
})();
