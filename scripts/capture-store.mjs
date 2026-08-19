import { chromium } from "playwright";
const B="http://localhost:3000", OUT="docs/screenshots";
const br=await chromium.launch();
const mk=async(w=1440,h=900)=>{const c=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:2}); return {c,p:await c.newPage()};};
const S=(p,ms)=>p.waitForTimeout(ms);
const go=async(p,u)=>{await p.goto(u,{waitUntil:"domcontentloaded",timeout:90000}); await S(p,3500);};
const addBtn=p=>p.locator('button:visible').filter({hasText:'Add to Cart'}).first();
const closeDrawer=async p=>{for(let i=0;i<4;i++){const c=p.locator('[aria-label="Close"]'); if(await c.count()){await c.first().click({force:true}); await S(p,700);} else break;}};
const done=[];

// --- 01 home (own context)
{ const {c,p}=await mk(); await go(p,B);
  await p.locator('a[href^="/product/"]').first().waitFor({timeout:60000});
  await S(p,1500); await p.screenshot({path:`${OUT}/01-home-listing.png`,fullPage:true});
  done.push("01"); await c.close(); }

// --- 02 mobile home
{ const {c,p}=await mk(390,844); await go(p,B);
  await p.locator('a[href^="/product/"]').first().waitFor({timeout:60000});
  await S(p,1500); await p.screenshot({path:`${OUT}/02-home-mobile.png`,fullPage:true});
  done.push("02"); await c.close(); }

// --- 03 product detail + 04 cart drawer (own context)
{ const {c,p}=await mk(); await go(p,B+"/product/noir-pinstripe-bloom-shirt");
  await addBtn(p).waitFor({timeout:60000}); await S(p,1200);
  await p.screenshot({path:`${OUT}/03-product-detail.png`,fullPage:true}); done.push("03");
  await addBtn(p).click({force:true}); await S(p,2000);
  await p.screenshot({path:`${OUT}/04-cart-drawer.png`}); done.push("04");
  await c.close(); }

// --- 05 cart page + 06 checkout (fresh context, add 2 products)
{ const {c,p}=await mk();
  for (const slug of ["noir-pinstripe-bloom-shirt","sky-doodle-blossom-shirt"]){
    await go(p,B+"/product/"+slug);
    await addBtn(p).waitFor({timeout:60000});
    await addBtn(p).click({force:true}); await S(p,1800); await closeDrawer(p);
  }
  await go(p,B+"/cart"); await closeDrawer(p);
  await p.waitForSelector('text=/Subtotal/i',{timeout:40000}); await S(p,1500);
  await p.screenshot({path:`${OUT}/05-cart-page.png`,fullPage:true}); done.push("05");
  await go(p,B+"/checkout"); await closeDrawer(p);
  await p.getByPlaceholder('Your name').waitFor({timeout:40000}); await S(p,1500);
  await p.screenshot({path:`${OUT}/06-checkout-form.png`,fullPage:true}); done.push("06");
  await c.close(); }

// --- 11 / 12 landing page
{ const {c,p}=await mk(); await go(p,B+"/l/noir-bloom-offer"); await S(p,2500);
  await p.screenshot({path:`${OUT}/11-landing-page.png`,fullPage:true}); done.push("11");
  await p.locator('#order').scrollIntoViewIfNeeded().catch(()=>{}); await S(p,1800);
  await p.screenshot({path:`${OUT}/12-landing-order-form.png`}); done.push("12");
  await c.close(); }

await br.close();
console.log("captured:", done.join(", "));
