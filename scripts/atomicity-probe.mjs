import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
const url = readFileSync(".env.local","utf8").match(/NEXT_PUBLIC_CONVEX_URL=(.+)/)[1].trim();
const c = new ConvexHttpClient(url);
const ps = await c.query("products:list", {});
const A = ps[0], B = ps[1];
const stock = (p,s)=>p.variants.find(v=>v.size===s).stock;
console.log("BEFORE:", A.name, "M =", stock(A,"M"), "|", B.name, "M =", stock(B,"M"));
console.log("\nAttempting an order where item 1 is VALID and item 2 is OUT OF STOCK…");
try {
  await c.mutation("orders:place",{
    customer:{name:"Atomicity Test",phone:"01712345678",address:"House 1, Road 2, Dhanmondi, Dhaka",area:"dhaka"},
    items:[{productId:A._id,qty:2,size:"M"},{productId:B._id,qty:99999,size:"M"}],
    payment:{method:"cod"}});
  console.log("  -> mutation RESOLVED (unexpected)");
} catch(e){ console.log("  -> mutation REJECTED (expected)"); }
const ps2 = await c.query("products:list", {});
const A2 = ps2.find(p=>p._id===A._id), B2 = ps2.find(p=>p._id===B._id);
console.log("\nAFTER: ", A2.name, "M =", stock(A2,"M"), "|", B2.name, "M =", stock(B2,"M"));
const ok = stock(A2,"M")===stock(A,"M") && stock(B2,"M")===stock(B,"M");
console.log("\nATOMICITY:", ok ? "PASS - item 1's stock decrement was rolled back" : "FAIL - stock was corrupted by the partial write");
