import { chromium } from "playwright";
const B="http://localhost:3000";
const br=await chromium.launch();
const page=await (await br.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2})).newPage();
const s=(ms)=>page.waitForTimeout(ms);
const go=async u=>{await page.goto(u,{waitUntil:"domcontentloaded",timeout:60000}); await s(3000);};

// 13 – login form (before auth)
await go(B+"/admin");
await page.getByPlaceholder('Password').waitFor({timeout:30000});
await page.screenshot({path:"docs/screenshots/13-admin-login.png"}); console.log("OK 13 login form");

// authenticate
await page.getByPlaceholder('Password').fill('luxe-admin-2026');
await page.getByRole('button',{name:'Sign in'}).click();
await page.waitForSelector('text=/Dashboard|Orders|Revenue/i',{timeout:40000});
await s(3000);
console.log("authenticated. token:", await page.evaluate(()=>!!localStorage.getItem('admin_token')));

const shots=[
  ["14-admin-dashboard.png","/admin","text=/Revenue|Pending|Dashboard/i"],
  ["15-admin-orders.png","/admin/orders","table"],
  ["17-admin-products.png","/admin/products","table"],
  ["19-admin-landing-list.png","/admin/landing","table"],
  ["21-admin-settings.png","/admin/settings","text=/Store|Delivery|Payments/i"],
  ["22-admin-tracking-debug.png","/admin/tracking","text=/Pixel|Event|Tracking/i"],
];
for (const [file,path,sel] of shots){
  try{
    await go(B+path);
    await page.waitForSelector(sel,{timeout:25000}).catch(()=>console.log("   (selector miss, capturing anyway)"));
    await s(2200);
    await page.screenshot({path:`docs/screenshots/${file}`, fullPage:true});
    console.log("OK "+file);
  }catch(e){ console.log("FAIL "+file+": "+e.message.split("\n")[0].slice(0,90)); }
}

// 16 – order detail
try{
  await go(B+"/admin/orders");
  await page.waitForSelector('table',{timeout:25000});
  await page.locator('tbody tr').first().click(); await s(2500);
  await page.screenshot({path:"docs/screenshots/16-admin-order-detail.png"});
  console.log("OK 16 order detail");
}catch(e){ console.log("FAIL 16: "+e.message.split("\n")[0].slice(0,90)); }

// 18 – product form
try{
  await go(B+"/admin/products");
  await page.getByRole('button',{name:/New product/}).first().click(); await s(2500);
  await page.screenshot({path:"docs/screenshots/18-admin-product-form.png"});
  console.log("OK 18 product form");
}catch(e){ console.log("FAIL 18: "+e.message.split("\n")[0].slice(0,90)); }

// 20 – landing builder
try{
  await go(B+"/admin/landing");
  await page.waitForSelector('a[href*="/admin/landing/edit?id="]',{timeout:25000});
  const href=await page.locator('a[href*="/admin/landing/edit?id="]').first().getAttribute('href');
  await go(B+href); await s(3000);
  await page.screenshot({path:"docs/screenshots/20-admin-landing-builder.png", fullPage:true});
  console.log("OK 20 landing builder ->", href);
}catch(e){ console.log("FAIL 20: "+e.message.split("\n")[0].slice(0,90)); }

// 11/12 – landing page (re-verify)
try{
  await go(B+"/l/noir-bloom-offer"); await s(3000);
  await page.screenshot({path:"docs/screenshots/11-landing-page.png", fullPage:true});
  console.log("OK 11 landing page");
  await page.locator('#order').scrollIntoViewIfNeeded().catch(()=>{}); await s(1800);
  await page.screenshot({path:"docs/screenshots/12-landing-order-form.png"});
  console.log("OK 12 landing order form");
}catch(e){ console.log("FAIL 11/12: "+e.message.split("\n")[0].slice(0,90)); }

await br.close();
