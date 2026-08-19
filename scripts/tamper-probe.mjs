import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
const url = readFileSync(".env.local","utf8").match(/NEXT_PUBLIC_CONVEX_URL=(.+)/)[1].trim();
const c = new ConvexHttpClient(url);
const p = (await c.query("products:list", {}))[0];
console.log("Real catalogue price of", p.name, "= BDT", p.price);
const r = await c.mutation("orders:place",{
  customer:{name:"Tamper Test",phone:"01712345678",address:"House 1, Road 2, Dhanmondi, Dhaka",area:"dhaka"},
  items:[{productId:p._id,qty:1,size:"M"}],
  payment:{method:"cod"},
  priceOverride: 1   // attacker tries to pay BDT 1
});
console.log("Order created:", r.orderNo, "subtotal =", r.subtotal, "total =", r.total);
console.log(r.subtotal === p.price ? "PASS - server ignored the forged price and used the catalogue price"
                                   : "FAIL - forged price was accepted!");
