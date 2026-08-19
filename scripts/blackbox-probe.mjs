// Black-box API-level probes against the running Convex dev deployment.
// Records REAL pass/fail evidence for the lab report.
import { ConvexHttpClient } from "convex/browser";
import { readFileSync, writeFileSync } from "fs";
const env = readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/)[1].trim();
const c = new ConvexHttpClient(url);
const results = [];
async function probe(id, scenario, expected, fn) {
  let actual, status;
  try { const r = await fn(); actual = "Resolved: " + JSON.stringify(r).slice(0, 180); }
  catch (e) { actual = "Rejected: " + String(e.message || e).split("\n")[0].slice(0, 180); }
  results.push({ id, scenario, expected, actual });
  console.log(`\n[${id}] ${scenario}\n  expected: ${expected}\n  actual:   ${actual}`);
}
const products = await c.query("products:list", {});
const p = products[0];
const pid = p._id;
console.log("Using product:", p.name, p.price, "stock M =", p.variants.find(v=>v.size==="M").stock);

await probe("BB-API-01","Place order with malformed phone (011...)","Rejected with 'Invalid phone number'",
  ()=>c.mutation("orders:place",{customer:{name:"T",phone:"01123456789",address:"A road, Dhaka",area:"dhaka"},items:[{productId:pid,qty:1,size:"M"}],payment:{method:"cod"}}));
await probe("BB-API-02","Place order with empty cart","Rejected with 'Cart is empty'",
  ()=>c.mutation("orders:place",{customer:{name:"T",phone:"01712345678",address:"A road, Dhaka",area:"dhaka"},items:[],payment:{method:"cod"}}));
await probe("BB-API-03","Order quantity greater than available stock","Rejected with 'Out of stock'",
  ()=>c.mutation("orders:place",{customer:{name:"T",phone:"01712345678",address:"A road, Dhaka",area:"dhaka"},items:[{productId:pid,qty:9999,size:"M"}],payment:{method:"cod"}}));
await probe("BB-API-04","Order a size that does not exist (XXXL)","Rejected with 'Variant unavailable'",
  ()=>c.mutation("orders:place",{customer:{name:"T",phone:"01712345678",address:"A road, Dhaka",area:"dhaka"},items:[{productId:pid,qty:1,size:"XXXL"}],payment:{method:"cod"}}));
await probe("BB-API-05","Validate a promo code that does not exist","valid:false, reason 'Invalid code'",
  ()=>c.query("promoCodes:validate",{code:"NOTREAL2026",subtotal:5000}));
await probe("BB-API-06","Track an order with a wrong phone number","Returns null (no data leak)",
  ()=>c.query("orders:track",{orderNo:"LX-20260728-3638",phone:"01999999999"}));
await probe("BB-API-07","Call an admin-only query with no valid session token","Rejected with 'Unauthorized'",
  ()=>c.query("orders:adminList",{token:"not-a-real-token"}));
await probe("BB-API-08","Create landing page with an invalid slug (spaces/uppercase)","Rejected (slug rule or Unauthorized first)",
  ()=>c.mutation("landingPages:create",{token:"not-a-real-token",data:{slug:"Bad Slug!",title:"x",productId:pid,status:"draft",sections:[]}}));
await probe("BB-API-09","Read public settings — must NOT expose the CAPI secret token","Object without 'capiToken' key",
  async()=>{const s=await c.query("settings:publicSettings",{});return {hasCapiToken:Object.hasOwn(s,"capiToken"),storeName:s.storeName};});
await probe("BB-API-10","Fetch a published landing page by slug","Returns page with product + sections",
  async()=>{const l=await c.query("landingPages:bySlug",{slug:"noir-bloom-offer"});return l?{slug:l.slug,status:l.status,price:l.product.price,sections:l.sections.length}:null;});
await probe("BB-API-11","Fetch an unpublished/nonexistent landing page","Returns null",
  ()=>c.query("landingPages:bySlug",{slug:"does-not-exist-xyz"}));
await probe("BB-API-12","Save abandoned checkout with invalid phone (should be silently ignored)","Returns null, nothing stored",
  ()=>c.mutation("orders:saveAbandoned",{phone:"123",items:[],total:0}));

writeFileSync("docs/blackbox-probe-results.json", JSON.stringify(results,null,2));
console.log("\n\nSaved", results.length, "probe results to docs/blackbox-probe-results.json");
