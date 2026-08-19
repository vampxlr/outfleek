import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
const url = readFileSync(".env.local","utf8").match(/NEXT_PUBLIC_CONVEX_URL=(.+)/)[1].trim();
const c = new ConvexHttpClient(url);
const p = (await c.query("products:list", {}))[0];
const s = await c.query("settings:publicSettings", {});
console.log(`Threshold = BDT ${s.freeDeliveryThreshold}, Dhaka fee = BDT ${s.deliveryFeeDhaka}, unit price = BDT ${p.price}\n`);
for (const qty of [1, 2]) {
  const r = await c.mutation("orders:place",{
    customer:{name:"Boundary Test",phone:"01712345678",address:"House 1, Road 2, Dhanmondi, Dhaka",area:"dhaka"},
    items:[{productId:p._id,qty,size:"L"}], payment:{method:"cod"}});
  const free = r.subtotal >= s.freeDeliveryThreshold;
  console.log(`qty=${qty}  subtotal=${r.subtotal}  (>= ${s.freeDeliveryThreshold}? ${free})  deliveryFee=${r.deliveryFee}  total=${r.total}  ${r.orderNo}`);
  console.log(`   -> ${ (free ? r.deliveryFee===0 : r.deliveryFee===s.deliveryFeeDhaka) ? "PASS" : "FAIL" }`);
}
