const http = require("http");
const base = { host: "localhost", port: 3100 };
const results = [];
function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const headers = {};
    if (data) headers["Content-Type"] = "application/json";
    if (cookie) headers.Cookie = cookie;
    const r = http.request({ ...base, path, method, headers }, (res) => {
      let buf = "";
      res.on("data", (ch) => (buf += ch));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: buf, text: res.headers["content-type"] }));
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}
function cookieOf(res, name) {
  const sc = res.headers["set-cookie"] || [];
  const hit = sc.find((c) => c.startsWith(name + "="));
  return hit ? hit.split(";")[0] : null;
}
function check(name, cond, detail) {
  results.push(cond ? "PASS" : "FAIL");
  console.log(`${cond ? "✓" : "✗"} ${name}${cond ? "" : "  -> " + (detail || "")}`);
}
(async () => {
  const products = JSON.parse((await req("GET", "/api/products?limit=3")).body).products;
  const pid = products[0].id;
  const email = `func${Date.now()}@t.com`;

  const regi = await req("POST", "/api/auth/register", { name: "Func User", email, password: "FuncPass1!", phone: "+919999999999" });
  const c = cookieOf(await req("POST", "/api/auth/login", { email, password: "FuncPass1!" }), "saayo_session");
  const a = cookieOf(await req("POST", "/api/auth/login", { email: "admin@saayo.example.com", password: "Admin@123" }), "saayo_session");

  // --- storefront reads ---
  const q = await req("GET", "/api/products?q=norda");
  check("search products?q=norda", q.status === 200 && JSON.parse(q.body).products.length > 0, q.status);
  const byId = await req("GET", `/api/products/${pid}`);
  check("product by id", byId.status === 200 && JSON.parse(byId.body).product.id === pid, byId.status);
  const cat = await req("GET", "/api/products?category=graphic-tees");
  check("products by category", cat.status === 200, cat.status);

  // --- cart PATCH / DELETE ---
  const add = await req("POST", "/api/cart", { productId: pid, quantity: 2 }, c);
  const itemId = JSON.parse(add.body).items[0].id;
  check("cart add", add.status === 201 && itemId, add.status);
  const upd = await req("PATCH", "/api/cart", { itemId, quantity: 5 }, c);
  check("cart PATCH qty", upd.status === 200 && JSON.parse(upd.body).items[0].quantity === 5, upd.status);
  const del = await req("DELETE", `/api/cart?itemId=${itemId}`, undefined, c);
  check("cart DELETE item", del.status === 200 && JSON.parse(del.body).items.length === 0, del.status);

  // --- wishlist POST toggle (add then remove) ---
  const wAdd = JSON.parse((await req("POST", "/api/wishlist", { productId: pid }, c)).body);
  const wRem = JSON.parse((await req("POST", "/api/wishlist", { productId: pid }, c)).body);
  const wGet = JSON.parse((await req("GET", "/api/wishlist", undefined, c)).body);
  check("wishlist toggle add+remove", wAdd.inWishlist === true && wRem.inWishlist === false && wGet.items.length === 0, `add=${wAdd.inWishlist} rem=${wRem.inWishlist} n=${wGet.items.length}`);

  // --- addresses CRUD ---
  const addr = { fullName: "Func User", phone: "+919999999999", line1: "5 Main Rd", city: "Mumbai", state: "MH", postalCode: "400001", country: "India", isDefault: true };
  const aPostRes = await req("POST", "/api/account/addresses", addr, c);
  const addrId = (() => { try { return JSON.parse(aPostRes.body).address?.id; } catch { return null; } })();
  check("address POST", aPostRes.status === 201 && addrId, `${aPostRes.status} ${aPostRes.body.slice(0, 120)}`);
  const aPut = await req("PUT", "/api/account/addresses", { ...addr, id: addrId, city: "Pune", line1: "9 New Rd" }, c);
  check("address PUT", aPut.status === 200 && JSON.parse(aPut.body).address.city === "Pune", aPut.status);
  const aDel = await req("DELETE", `/api/account/addresses?id=${addrId}`, undefined, c);
  check("address DELETE", aDel.status === 200, aDel.status);

  // --- profile PUT ---
  const prof = await req("PUT", "/api/account/profile", { name: "Renamed User", phone: "+919876543210", newsletterOptIn: true }, c);
  check("profile PUT", prof.status === 200 && JSON.parse(prof.body).user.name === "Renamed User", prof.status);

  // --- notifications (order will create one) ---
  await req("POST", "/api/cart", { productId: pid, quantity: 1 }, c);
  const order = JSON.parse((await req("POST", "/api/orders", {
    email, phone: "+919999999999",
    shippingAddress: { fullName: "Func User", phone: "+919999999999", line1: "5 Main Rd", city: "Mumbai", state: "MH", postalCode: "400001", country: "India" },
    paymentMethod: "cod",
  }, c)).body);
  check("COD order", !!order.id && order.status === "pending", order.error || order.orderNumber);
  const myOrders = await req("GET", "/api/orders", undefined, c);
  check("my orders GET", myOrders.status === 200 && JSON.parse(myOrders.body).orders.length >= 1, myOrders.status);
  const ordDetail = await req("GET", `/api/orders/${order.id}`, undefined, c);
  check("order detail GET", ordDetail.status === 200 && JSON.parse(ordDetail.body).order.id === order.id, ordDetail.status);
  const okCoupon = await req("POST", "/api/coupons/validate", { code: "WELCOME10", subtotal: 16999 }, c);
  const okCouponJ = JSON.parse(okCoupon.body);
  check("valid coupon WELCOME10", okCoupon.status === 200 && okCouponJ.valid === true && Number(okCouponJ.discount) === 500, `${okCoupon.status} disc=${okCouponJ.discount}`);

  // --- coupon applied to a real order (5 tees cross the free-shipping threshold) + per-user limit ---
  const beforeUsed = (JSON.parse((await req("GET", "/api/coupons")).body).coupons || []).find((cu) => cu.code === "WELCOME10")?.usedCount ?? 0;
  await req("POST", "/api/cart", { productId: pid, quantity: 5 }, c);
  const coOrder = JSON.parse((await req("POST", "/api/orders", {
    email, phone: "+919999999999",
    shippingAddress: { fullName: "Func User", phone: "+919999999999", line1: "5 Main Rd", city: "Mumbai", state: "MH", postalCode: "400001", country: "India" },
    paymentMethod: "cod", couponCode: "WELCOME10",
  }, c)).body);
  check("order with coupon applied", coOrder.id && coOrder.couponCode === "WELCOME10" && Number(coOrder.discount) === 500 && Number(coOrder.total) === Number(coOrder.subtotal) - 500, `${coOrder.error || `${coOrder.couponCode} disc=${coOrder.discount} total=${coOrder.total}`}`);
  const usedAfter = (JSON.parse((await req("GET", "/api/coupons")).body).coupons || []).find((cu) => cu.code === "WELCOME10")?.usedCount ?? 0;
  check("coupon usedCount incremented", usedAfter === beforeUsed + 1, `before=${beforeUsed} after=${usedAfter}`);
  await req("POST", "/api/cart", { productId: pid, quantity: 1 }, c);
  const coOrder2 = await req("POST", "/api/orders", {
    email, phone: "+919999999999",
    shippingAddress: { fullName: "Func User", phone: "+919999999999", line1: "5 Main Rd", city: "Mumbai", state: "MH", postalCode: "400001", country: "India" },
    paymentMethod: "cod", couponCode: "WELCOME10",
  }, c);
  check("per-user coupon limit enforced", coOrder2.status === 400 && (coOrder2.body.includes("already used") || coOrder2.body.includes("usage limit")), `${coOrder2.status} ${coOrder2.body.slice(0, 80)}`);
  const notif = await req("GET", "/api/account/notifications", undefined, c);
  check("notifications GET (order placed)", notif.status === 200 && JSON.parse(notif.body).notifications.length >= 1, notif.status);
  const nRead = await req("PATCH", "/api/account/notifications", {}, c);
  check("notifications PATCH all read", nRead.status === 200, nRead.status);

  // --- review + moderation ---
  const reviewsBefore = JSON.parse((await req("GET", `/api/reviews?productId=${pid}`)).body).count;
  const rev = await req("POST", "/api/reviews", { productId: pid, rating: 4, title: "Nice", body: "Good quality and look", }, c);
  const revId = JSON.parse(rev.body).review?.id;
  check("review POST pending", rev.status === 201 && JSON.parse(rev.body).review.status === "pending", rev.status);
  const mod = await req("PATCH", "/api/admin/reviews", { id: revId, status: "approved" }, a);
  check("admin review approve", mod.status === 200 && JSON.parse(mod.body).review.status === "approved", mod.status);
  const reviewsAfter = JSON.parse((await req("GET", `/api/reviews?productId=${pid}`)).body).count;
  check("approved review visible in list", reviewsAfter === reviewsBefore + 1, `before=${reviewsBefore} after=${reviewsAfter}`);

  // --- admin order status flow (ship -> cancel restores stock) ---
  const stockBefore = JSON.parse((await req("GET", `/api/products/${pid}`)).body).product.stockQuantity;
  const ship = await req("PATCH", "/api/admin/orders", { id: order.id, status: "shipped", trackingNumber: "TRK123", carrier: "BlueDart" }, a);
  check("admin order shipped", ship.status === 200 && JSON.parse(ship.body).order.status === "shipped", ship.status);
  const cancel = await req("PATCH", "/api/admin/orders", { id: order.id, status: "cancelled" }, a);
  const stockAfter = JSON.parse((await req("GET", `/api/products/${pid}`)).body).product.stockQuantity;
  check("admin order cancel restores stock", cancel.status === 200 && stockAfter === stockBefore + 1, `before=${stockBefore} after=${stockAfter}`);

  // --- admin CRUD ---
  const banner = JSON.parse((await req("POST", "/api/admin/banners", { title: "TestBanner", link: "/shop" }, a)).body).banner;
  check("banner POST", !!banner.id, "no id");
  const bannerPut = await req("PUT", "/api/admin/banners", { id: banner.id, title: "TestBanner2" }, a);
  check("banner PUT", bannerPut.status === 200, bannerPut.status);
  check("banner DELETE", (await req("DELETE", `/api/admin/banners?id=${banner.id}`, undefined, a)).status === 200);

  const brand = JSON.parse((await req("POST", "/api/brands", { name: `TestBrand${Date.now()}` }, a)).body).brand;
  check("brand POST", !!brand.id, "no id");
  check("brand PUT", (await req("PUT", "/api/brands", { id: brand.id, name: "Renamed" }, a)).status === 200);
  check("brand DELETE", (await req("DELETE", `/api/brands?id=${brand.id}`, undefined, a)).status === 200);

  const category = JSON.parse((await req("POST", "/api/categories", { name: `TestCat${Date.now()}` }, a)).body).category;
  check("category POST", !!category.id, "no id");
  check("category PUT", (await req("PUT", "/api/categories", { id: category.id, name: "Renamed" }, a)).status === 200);
  check("category DELETE", (await req("DELETE", `/api/categories?id=${category.id}`, undefined, a)).status === 200);

  // --- product admin CRUD ---
  const prodFields = {
    name: `Func Product ${Date.now()}`, slug: `func-product-${Date.now()}`, sku: `FP${Date.now()}`,
    regularPrice: 1999, stockQuantity: 10, images: [],
  };
  const nProd = JSON.parse((await req("POST", "/api/products", prodFields, a)).body).product;
  check("product POST", !!nProd.id, "no id");
  const nProdPut = await req("PUT", `/api/products/${nProd.id}`, { ...prodFields, id: nProd.id, regularPrice: 2499 }, a);
  check("product PUT", nProdPut.status === 200 && JSON.parse(nProdPut.body).product.regularPrice == 2499, nProdPut.status);
  check("product DELETE", (await req("DELETE", `/api/products/${nProd.id}`, undefined, a)).status === 200);

  // --- account password change + logout ---
  const pw = await req("PUT", "/api/account/profile/password", { currentPassword: "FuncPass1!", newPassword: "FuncPass2!" }, c);
  check("change password", pw.status === 200, pw.status);
  if (pw.status === 200) {
    await req("PUT", "/api/account/profile/password", { currentPassword: "FuncPass2!", newPassword: "FuncPass1!" }, c);
  }
  const lout = await req("POST", "/api/auth/logout", {}, c);
  check("logout", lout.status === 200, lout.status);

  const coupon = JSON.parse((await req("POST", "/api/coupons", { code: `TEST${Date.now()}`.slice(0, 12), type: "fixed", value: 50 }, a)).body).coupon;
  check("coupon POST", !!coupon.id, "no id");
  check("coupon PUT", (await req("PUT", "/api/coupons", { id: coupon.id, value: 75 }, a)).status === 200);
  check("coupon DELETE", (await req("DELETE", `/api/coupons?id=${coupon.id}`, undefined, a)).status === 200);

  const page = JSON.parse((await req("POST", "/api/admin/pages", { title: "TestPage", slug: `test-page-${Date.now()}` }, a)).body).page;
  check("page POST", !!page.id, "no id");
  check("page PUT", (await req("PUT", "/api/admin/pages", { id: page.id, status: "published" }, a)).status === 200);
  check("page DELETE", (await req("DELETE", `/api/admin/pages?id=${page.id}`, undefined, a)).status === 200);

  const blog = JSON.parse((await req("POST", "/api/admin/blog", { title: `TestPost${Date.now()}`, status: "draft" }, a)).body).post;
  check("blog POST", !!blog.id && blog.status === "draft", "no id");
  check("blog DELETE", (await req("DELETE", `/api/admin/blog?id=${blog.id}`, undefined, a)).status === 200);

  // --- site-control modules: collections, customer groups, warehouses ---
  const coll = JSON.parse((await req("POST", "/api/admin/collections", { name: `TestColl${Date.now()}` }, a)).body).collection;
  check("collection POST", !!coll.id, "no id");
  check("collection PUT", (await req("PUT", "/api/admin/collections", { id: coll.id, name: "Renamed Coll" }, a)).status === 200);
  check("collection DELETE", (await req("DELETE", `/api/admin/collections?id=${coll.id}`, undefined, a)).status === 200);

  const grp = JSON.parse((await req("POST", "/api/admin/customer-groups", { name: `TestGrp${Date.now()}`, discountPercent: 5 }, a)).body).group;
  check("customer-group POST", !!grp.id, "no id");
  check("customer-group PUT", (await req("PUT", "/api/admin/customer-groups", { id: grp.id, discountPercent: 10 }, a)).status === 200);
  check("customer-group DELETE", (await req("DELETE", `/api/admin/customer-groups?id=${grp.id}`, undefined, a)).status === 200);

  const wh = JSON.parse((await req("POST", "/api/admin/warehouses", { name: `TestWH${Date.now()}` }, a)).body).warehouse;
  check("warehouse POST", !!wh.id && !!wh.code, "no id/code");
  check("warehouse PUT", (await req("PUT", "/api/admin/warehouses", { id: wh.id, name: "Renamed WH" }, a)).status === 200);
  check("warehouse DELETE", (await req("DELETE", `/api/admin/warehouses?id=${wh.id}`, undefined, a)).status === 200);

  // --- suppliers + purchase orders (create, partial/full receive, cancel) ---
  const sup = JSON.parse((await req("POST", "/api/admin/suppliers", { name: `TestSupp${Date.now()}` }, a)).body).supplier;
  check("supplier POST", !!sup.id, "no id");

  const poStockBefore = JSON.parse((await req("GET", `/api/products/${pid}`)).body).product.stockQuantity;
  const po = JSON.parse((await req("POST", "/api/admin/purchase-orders", { supplierId: sup.id, items: [{ productId: pid, quantity: 3, unitCost: 100 }] }, a)).body).purchaseOrder;
  check("purchase order POST", !!po.id && po.status === "draft" && po.items.length === 1, "no id");
  const poItemId = po.items[0].id;
  const partial = await req("PATCH", "/api/admin/purchase-orders", { id: po.id, status: "received", items: [{ itemId: poItemId, receivedQty: 1 }] }, a);
  check("PO partial receive → partial", partial.status === 200 && JSON.parse(partial.body).purchaseOrder.status === "partial", `${partial.status} ${partial.body.slice(0, 80)}`);
  const full = await req("PATCH", "/api/admin/purchase-orders", { id: po.id, status: "received", items: [{ itemId: poItemId, receivedQty: 3 }] }, a);
  const poStockAfter = JSON.parse((await req("GET", `/api/products/${pid}`)).body).product.stockQuantity;
  check("PO full receive restocks product", full.status === 200 && JSON.parse(full.body).purchaseOrder.status === "received" && poStockAfter === poStockBefore + 3, `before=${poStockBefore} after=${poStockAfter}`);
  const po2 = JSON.parse((await req("POST", "/api/admin/purchase-orders", { supplierId: sup.id, items: [{ productId: pid, quantity: 1, unitCost: 50 }] }, a)).body).purchaseOrder;
  const poCancel = await req("PATCH", "/api/admin/purchase-orders", { id: po2.id, status: "cancelled" }, a);
  check("PO cancel", poCancel.status === 200 && JSON.parse(poCancel.body).purchaseOrder.status === "cancelled", poCancel.status);
  check("PO DELETE", (await req("DELETE", `/api/admin/purchase-orders?id=${po.id}`, undefined, a)).status === 200);
  await req("DELETE", `/api/admin/purchase-orders?id=${po2.id}`, undefined, a);
  check("supplier PUT", (await req("PUT", "/api/admin/suppliers", { id: sup.id, name: "Renamed Supp" }, a)).status === 200);
  check("supplier DELETE", (await req("DELETE", `/api/admin/suppliers?id=${sup.id}`, undefined, a)).status === 200);
  await req("DELETE", `/api/admin/purchase-orders?id=${po2.id}`, undefined, a);

  // --- product duplicate + bulk actions ---
  const bulkProd = JSON.parse((await req("POST", "/api/products", { name: `Bulk Product ${Date.now()}`, slug: `bulk-product-${Date.now()}`, sku: `BK${Date.now()}`, regularPrice: 999, stockQuantity: 5, images: [] }, a)).body).product;
  const dup = await req("POST", "/api/admin/products/duplicate", { id: bulkProd.id }, a);
  check("product duplicate (draft copy)", dup.status === 201 && /\(Copy\)/.test(JSON.parse(dup.body).product.name) && JSON.parse(dup.body).product.visibility === "draft", dup.status);
  await req("DELETE", `/api/products/${JSON.parse(dup.body).product.id}`, undefined, a);
  const arch = await req("POST", "/api/admin/products/bulk", { action: "archive", ids: [bulkProd.id] }, a);
  check("bulk archive", arch.status === 200 && JSON.parse(arch.body).count === 1, arch.status);
  const act = await req("POST", "/api/admin/products/bulk", { action: "activate", ids: [bulkProd.id] }, a);
  check("bulk activate", act.status === 200 && JSON.parse(act.body).count === 1, act.status);
  check("bulk test product cleanup", (await req("DELETE", `/api/products/${bulkProd.id}`, undefined, a)).status === 200);

  // --- admin global search ---
  const search = await req("GET", "/api/admin/search?q=norda", undefined, a);
  check("admin search", search.status === 200 && Array.isArray(JSON.parse(search.body).products), search.status);

  // --- inventory adjustment ---
  const inv = JSON.parse((await req("GET", "/api/admin/inventory?limit=50", undefined, a)).body).inventory[0];
  check("inventory GET", !!inv, "no rows");
  if (inv) {
    const adj = await req("POST", "/api/admin/inventory", { inventoryId: inv.id, adjustment: 3, reason: "func-test" }, a);
    check("inventory adjust +3", adj.status === 200 && JSON.parse(adj.body).inventory.availableQty === inv.availableQty + 3, adj.status);
    await req("POST", "/api/admin/inventory", { inventoryId: inv.id, adjustment: -3, reason: "func-test-revert" }, a);
  }

  // --- exports ---
  for (const t of ["orders", "products", "customers", "inventory", "3d-models"].map(() => ["orders", "products", "customers", "inventory"])[0]) {}
  const exOrders = await req("GET", "/api/admin/export?type=orders", undefined, a);
  check("export orders CSV", exOrders.status === 200 && (exOrders.text || "").includes("csv") && exOrders.body.startsWith("orderNumber"), exOrders.status);
  const exProducts = await req("GET", "/api/admin/export?type=products", undefined, a);
  check("export products CSV", exProducts.status === 200 && exProducts.body.startsWith("name,sku"), exProducts.status);
  const exBad = await req("GET", "/api/admin/export?type=bogus", undefined, a);
  check("export bogus rejected", exBad.status === 400, exBad.status);

  // --- admin lists ---
  for (const [p, perm] of [["/api/admin/refunds", "200"], ["/api/admin/payments", "200"], ["/api/admin/settings", "200"], ["/api/admin/staff", "200"], ["/api/admin/audit-logs", "200"], ["/api/admin/shipping", "200"]]) {
    const r = await req("GET", p, undefined, a);
    check(`admin GET ${p}`, String(r.status) === perm, r.status);
  }

  // --- remaining admin write paths ---
  const refund = await req("POST", "/api/admin/refunds", { orderId: order.id, amount: 100, reason: "func-test" }, a);
  check("refund POST", refund.status === 201 && JSON.parse(refund.body).refund.status === "processed", `${refund.status} ${refund.body.slice(0, 120)}`);
  const payList = (JSON.parse((await req("GET", "/api/admin/payments", undefined, a)).body).payments || []);
  if (payList.length) {
    const payPatch = await req("PATCH", "/api/admin/payments", { id: payList[0].id, status: "failed" }, a);
    check("payment PATCH", payPatch.status === 200 && JSON.parse(payPatch.body).payment.status === "failed", payPatch.status);
  } else { console.log("  (skip: no payment rows)"); }
  const shipPut = await req("PUT", "/api/admin/shipping", { rules: [{ key: "shipping.freeThreshold", value: "5000" }] }, a);
  check("shipping PUT", shipPut.status === 200, shipPut.status);
  const shipGet = await req("GET", "/api/admin/shipping", undefined, a);
  check("shipping GET reflects", shipGet.status === 200 && JSON.parse(shipGet.body).rules["shipping.freeThreshold"] === "5000", shipGet.status);
  const setPut = await req("PUT", "/api/admin/settings", { storeName: "Saayo 3D Test", codEnabled: true }, a);
  check("settings PUT", setPut.status === 200, setPut.status);
  const setGet = await req("GET", "/api/admin/settings", undefined, a);
  check("settings GET reflects", setGet.status === 200 && JSON.parse(setGet.body).settings.storeName === "Saayo 3D Test", setGet.status);
  const qList = (JSON.parse((await req("GET", "/api/admin/questions", undefined, a)).body).questions || []);
  if (qList.length) {
    const qPatch = await req("POST", "/api/admin/questions", { questionId: qList[0].id, answer: "Yes, it does.", status: "answered" }, a);
    check("question answered", qPatch.status === 200, qPatch.status);
  } else { console.log("  (skip: no questions seeded)"); }
  const nList = (JSON.parse((await req("GET", "/api/account/notifications", undefined, c)).body).notifications || []);
  if (nList.length) {
    const nPatch = await req("PATCH", "/api/account/notifications", { id: nList[0].id, read: true }, c);
    check("notification single PATCH", nPatch.status === 200, nPatch.status);
  }

  // --- provider guard rails (unconfigured envs must degrade gracefully) ---
  const payAnon = await req("POST", "/api/payments", { orderId: order.id, provider: "stripe" });
  check("payments POST requires login", payAnon.status === 401, payAnon.status);
  const upAnon = await req("POST", "/api/upload", { dataUrl: "data:image/png;base64,iVBORw0KGgo=" });
  check("upload requires login", upAnon.status === 401, upAnon.status);
  const modelsGet = await req("GET", "/api/3d-models", undefined, a);
  check("3d-models GET", modelsGet.status === 200 && Array.isArray(JSON.parse(modelsGet.body).models), modelsGet.status);

  // --- authorization boundaries ---
  const c2 = cookieOf(await req("POST", "/api/auth/login", { email, password: "FuncPass1!" }), "saayo_session");
  const custAdmin = await req("GET", "/api/admin/orders", undefined, c2);
  check("customer blocked from admin API", custAdmin.status === 403, custAdmin.status);
  const revAdmin = await req("GET", "/api/admin/orders", undefined, c);
  check("revoked session (logout) blocked from admin API", revAdmin.status === 401, revAdmin.status);
  const anonAdmin = await req("GET", "/api/admin/orders");
  check("anon blocked from admin API", anonAdmin.status === 401, anonAdmin.status);
  const guestNoCart = await req("POST", "/api/orders", {
    email: "guest@t.com", phone: "+919999999999",
    shippingAddress: { fullName: "Guest", phone: "+919999999999", line1: "1 G St", city: "Delhi", state: "DL", postalCode: "110001", country: "India" },
    paymentMethod: "cod",
  });
  check("guest order without cart rejected", guestNoCart.status === 400 && guestNoCart.body.includes("empty"), guestNoCart.status);

  // full guest flow: guest cookie cart -> COD order -> cart cleared
  const gAdd = await req("POST", "/api/cart", { productId: pid, quantity: 1 });
  const gCookie = cookieOf(gAdd, "saayo_guest_cart");
  const gOrderRes = await req("POST", "/api/orders", {
    email: "guest2@t.com", phone: "+919999999999",
    shippingAddress: { fullName: "Guest Two", phone: "+919999999999", line1: "2 G St", city: "Delhi", state: "DL", postalCode: "110001", country: "India" },
    paymentMethod: "cod",
  }, gCookie);
  const gOrder = JSON.parse(gOrderRes.body);
  const gCart = JSON.parse((await req("GET", "/api/cart", undefined, cookieOf(gOrderRes, "saayo_guest_cart") || gCookie)).body);
  check("guest COD order placed", !!gOrder.id && gOrder.status === "pending", gOrder.error || gOrder.status);
  check("guest cart cleared after order", gCart.items.length === 0, `${gCart.items.length}`);
  const badCoupon = await req("POST", "/api/coupons/validate", { code: "NOPE123", subtotal: 1000 });
  check("invalid coupon rejected", badCoupon.status === 404 && badCoupon.body.includes("Invalid coupon"), badCoupon.status);

  const fails = results.filter((r) => r === "FAIL").length;
  console.log(`\n==== ${results.length - fails}/${results.length} passed ====`);
  if (fails) process.exitCode = 1;
})().catch((e) => { console.error("FATAL", e); process.exit(1); });