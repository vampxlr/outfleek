/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bootstrap from "../bootstrap.js";
import type * as capi from "../capi.js";
import type * as capiHelpers from "../capiHelpers.js";
import type * as categories from "../categories.js";
import type * as landingPages from "../landingPages.js";
import type * as lib from "../lib.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as promoCodes from "../promoCodes.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bootstrap: typeof bootstrap;
  capi: typeof capi;
  capiHelpers: typeof capiHelpers;
  categories: typeof categories;
  landingPages: typeof landingPages;
  lib: typeof lib;
  orders: typeof orders;
  products: typeof products;
  promoCodes: typeof promoCodes;
  seed: typeof seed;
  settings: typeof settings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
