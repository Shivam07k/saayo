/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ROLES = {
  "Super Admin": [
    "dashboard:view", "products:manage", "categories:manage", "brands:manage",
    "collections:manage", "inventory:manage", "warehouses:manage", "suppliers:manage",
    "orders:manage", "returns:manage", "customers:manage", "reviews:manage",
    "coupons:manage", "banners:manage", "pages:manage", "blog:manage",
    "payments:manage", "shipping:manage", "taxes:manage", "reports:view",
    "staff:manage", "settings:manage", "audit:view", "models:manage",
  ],
  "Store Manager": [
    "dashboard:view", "products:manage", "categories:manage", "brands:manage",
    "collections:manage", "inventory:manage", "orders:manage", "returns:manage",
    "customers:manage", "reviews:manage", "coupons:manage", "banners:manage",
    "pages:manage", "payments:manage", "reports:view", "models:manage",
  ],
  "Product Manager": [
    "dashboard:view", "products:manage", "categories:manage", "brands:manage",
    "collections:manage", "inventory:view", "models:manage", "reports:view",
  ],
  "Order Manager": [
    "dashboard:view", "orders:manage", "returns:manage", "shipping:manage",
    "payments:manage", "inventory:view",
  ],
  "Inventory Manager": ["dashboard:view", "inventory:manage", "warehouses:manage", "suppliers:manage"],
  "Marketing Manager": [
    "dashboard:view", "coupons:manage", "banners:manage", "pages:manage",
    "blog:manage", "reports:view",
  ],
  "Customer Support": ["orders:view", "returns:manage", "customers:manage", "reviews:manage"],
  Accountant: ["dashboard:view", "payments:manage", "orders:view", "reports:view"],
  "3D Content Manager": ["models:manage", "products:view"],
};

async function main() {
  console.log("🌱 Seeding database...");

  // --- Roles & permissions
  const roles = {};
  for (const [name, perms] of Object.entries(ROLES)) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystem: true, description: `${name} role` },
    });
    await prisma.permission.deleteMany({ where: { roleId: roles[name].id } });
    await prisma.permission.createMany({
      data: perms.map((key) => ({ key, roleId: roles[name].id })),
      skipDuplicates: true,
    });
  }

  // --- Admin + customer users
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const customerPassword = await bcrypt.hash("Test@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@saayo.example.com" },
    update: {},
    create: {
      email: "admin@saayo.example.com",
      name: "Store Admin",
      passwordHash: adminPassword,
      emailVerified: true,
      roleId: roles["Super Admin"].id,
      referralCode: "SAYOOADMIN",
    },
  });

  // --- Customer role for public users (created before the demo customer so it can reference it)
  const customerRole = await prisma.role.upsert({
    where: { name: "Customer" },
    update: {},
    create: { name: "Customer", isSystem: false, description: "Registered shoppers" },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@saayo.example.com" },
    update: {},
    create: {
      email: "customer@saayo.example.com",
      name: "Demo Customer",
      phone: "+91 98765 43210",
      passwordHash: customerPassword,
      emailVerified: true,
      roleId: customerRole.id,
      referralCode: "DEMO100",
    },
  });

  // --- Categories
  const cats = [
    ["Graphic Tees", "Statement prints, artwork and band tees", "graphic-tees"],
    ["Plain Basics", "Solid crewneck essentials in every color", "plain-basics"],
    ["Oversized Tees", "Relaxed streetwear fits with dropped shoulders", "oversized-tees"],
    ["Polos", "Collared comfort for smart-casual looks", "polos"],
    ["Long Sleeves", "Crewnecks and long-sleeve tees for cooler days", "long-sleeves"],
    ["Crop Tees", "Short, boxy cuts with a modern silhouette", "crop-tees"],
  ];
  const categoryMap = {};
  for (const [name, desc, slug] of cats) {
    categoryMap[slug] = await prisma.category.upsert({
      where: { slug },
      update: { description: desc },
      create: { name, slug, description: desc },
    });
  }

  // --- Brands
  const brands = ["Norda", "Threadwell", "Studio K", "Velour", "Cotton Co"];
  const brandMap = {};
  for (const name of brands) {
    brandMap[name] = await prisma.brand.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
    });
  }

  // --- Collections
  const collection = await prisma.collection.upsert({
    where: { slug: "new-arrivals" },
    update: {},
    create: { name: "New Arrivals", slug: "new-arrivals" },
  });

  // --- Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: "WH-MAIN" },
    update: {},
    create: { name: "Main Warehouse", code: "WH-MAIN", address: "123 Logistics Park, Mumbai" },
  });

  // --- Products
  await prisma.relatedProduct.deleteMany({});
  await prisma.productAttribute.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product3DModel.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productQuestion.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.banner.deleteMany({});
  await prisma.page.deleteMany({});

  // Open a few known t-shirt photos from Unsplash (cycled per product)
  const TEE_IMAGES = [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200",
    "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200",
  ];
  function productImages(alt, offset) {
    return [0, 1, 2].map((i) => ({
      url: TEE_IMAGES[(offset + i) % TEE_IMAGES.length],
      alt,
      position: i,
    }));
  }

  const products = [
    {
      name: "Signature Oversized Tee",
      slug: "signature-oversized-tee",
      category: "oversized-tees",
      brand: "Norda",
      short: "Relaxed drop-shoulder tee with a 360° 3D configurator.",
      desc: "A heavy-gauge streetwear staple. Match the vibe in real time - customize body, sleeve and collar color before you buy, right in the 3D viewer.",
      sku: "TEE-3D-001",
      regularPrice: 1999,
      salePrice: 1499,
      cost: 480,
      stock: 140,
      weight: 0.25,
      featured: true,
      bestSeller: true,
      trending: true,
      flashSale: true,
      flashPrice: 1299,
      model: "/models/sample-tshirt-oversized.glb",
      modelName: "Oversized Tee GLB",
      ar: true,
      tags: ["tee", "oversized", "streetwear", "3d"],
      colors: ["#f5f5f4", "#1f2937", "#78716c"],
      materials: ["Cotton", "Modal", "Organic"],
    },
    {
      name: "Apex Graphic Tee",
      slug: "apex-graphic-tee",
      category: "graphic-tees",
      brand: "Velour",
      short: "Fade-resistant print on a 100% combed cotton tee.",
      desc: "Bold artwork printed with water-based inks that won't crack or fade. Preview every colorway in the 3D configurator before adding to cart.",
      sku: "TEE-3D-002",
      regularPrice: 1699,
      salePrice: 1299,
      cost: 420,
      stock: 110,
      weight: 0.22,
      featured: true,
      bestSeller: true,
      trending: false,
      model: "/models/sample-tshirt.glb",
      modelName: "Graphic Tee GLB",
      ar: true,
      tags: ["tee", "graphic", "print", "3d"],
      colors: ["#0f172a", "#ffffff", "#92400e"],
      materials: ["Combed Cotton", "Cotton"],
    },
    {
      name: "Ultra Soft Plain Tee",
      slug: "ultra-soft-plain-tee",
      category: "plain-basics",
      brand: "Threadwell",
      short: "Buttery-soft everyday tee you'll never want to take off.",
      desc: "Four-way stretch jersey with a mid-weight drape. Perfect layering piece - see the fit in 3D and pick from 12 colors.",
      sku: "TEE-3D-003",
      regularPrice: 1299,
      salePrice: 999,
      cost: 320,
      stock: 220,
      weight: 0.2,
      featured: true,
      bestSeller: true,
      trending: true,
      model: "/models/sample-tshirt.glb",
      modelName: "Plain Tee GLB",
      ar: true,
      tags: ["basics", "plain", "cotton", "3d"],
      colors: ["#1d4ed8", "#059669", "#be123c", "#18181b"],
      materials: ["Cotton", "Viscose"],
    },
    {
      name: "Classic Polo",
      slug: "classic-polo",
      category: "polos",
      brand: "Studio K",
      short: "Pique-cotton polo with a flattering ribbed collar.",
      desc: "Smart-casual staple with reinforced shoulder seams. Configure collar and body colors in the 3D viewer for a custom look.",
      sku: "TEE-3D-004",
      regularPrice: 2199,
      salePrice: 1799,
      cost: 620,
      stock: 75,
      weight: 0.26,
      featured: false,
      bestSeller: true,
      trending: false,
      model: "/models/sample-tshirt.glb",
      modelName: "Polo GLB",
      ar: true,
      tags: ["polo", "smart", "pique"],
      colors: ["#059669", "#1e40af", "#0f172a", "#ffffff"],
      materials: ["Pique Cotton"],
    },
    {
      name: "Boxy Crop Tee",
      slug: "boxy-crop-tee",
      category: "crop-tees",
      brand: "Cotton Co",
      short: "Short, boxy cut that sits perfectly at the waist.",
      desc: "A modern cropped silhouette with a clean rib neckline. See the crop length and fit in the 3D viewer - pick body and sleeve colors.",
      sku: "TEE-3D-005",
      regularPrice: 1499,
      cost: 380,
      stock: 60,
      weight: 0.19,
      featured: true,
      trending: true,
      model: "/models/sample-tshirt.glb",
      modelName: "Crop Tee GLB",
      ar: true,
      tags: ["crop", "boxy", "streetwear"],
      colors: ["#f59e0b", "#0ea5e9", "#1f2937"],
      materials: ["Cotton"],
    },
    {
      name: "Norda Long Sleeve Crew",
      slug: "norda-long-sleeve-crew",
      category: "long-sleeves",
      brand: "Norda",
      short: "Heavyweight crew for cooler days, cut for comfort.",
      desc: "295gsm fleece-lined crew that keeps its shape wash after wash. Rotate and zoom to check the sleeve and cuff details.",
      sku: "TEE-3D-006",
      regularPrice: 2599,
      salePrice: 2099,
      cost: 780,
      stock: 90,
      weight: 0.34,
      featured: true,
      bestSeller: true,
      trending: true,
      model: "/models/sample-tshirt-oversized.glb",
      modelName: "Long Sleeve GLB",
      ar: false,
      tags: ["long-sleeve", "crew", "heavyweight"],
      colors: ["#44403c", "#78716c", "#292524"],
      materials: ["Fleece", "Cotton"],
    },
    {
      name: "Vintage Wash Tee",
      slug: "vintage-wash-tee",
      category: "graphic-tees",
      brand: "Threadwell",
      short: "Pre-washed, sun-faded colors with a lived-in feel.",
      desc: "Garment-dyed for a vintage tint that only gets better with age. Compare wash tones in the 3D configurator.",
      sku: "TEE-3D-007",
      regularPrice: 1799,
      salePrice: 1499,
      cost: 500,
      stock: 85,
      weight: 0.23,
      featured: false,
      trending: true,
      model: "/models/sample-tshirt.glb",
      modelName: "Vintage Tee GLB",
      ar: true,
      tags: ["vintage", "wash", "garment-dyed"],
      colors: ["#a16207", "#9a3412", "#365314"],
      materials: ["Combed Cotton"],
    },
    {
      name: "Heavyweight Pocket Tee",
      slug: "heavyweight-pocket-tee",
      category: "plain-basics",
      brand: "Studio K",
      short: "Thick 240gsm tee with a utility chest pocket.",
      desc: "Raw-hem pocket detail on a sturdy frame. Customize the body, pocket and collar colors live in 3D.",
      sku: "TEE-3D-008",
      regularPrice: 1899,
      cost: 560,
      stock: 66,
      weight: 0.28,
      featured: true,
      trending: true,
      model: "/models/sample-tshirt.glb",
      modelName: "Pocket Tee GLB",
      ar: true,
      tags: ["pocket", "heavyweight", "basics"],
      colors: ["#e5e7eb", "#1f2937", "#7c3aed"],
      materials: ["Heavy Cotton"],
    },
  ];

  const now = new Date();
  const createdProducts = [];
  for (const [i, p] of products.entries()) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.short,
        description: p.desc,
        sku: p.sku,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice ?? null,
        costPrice: p.cost,
        stockQuantity: p.stock,
        lowStockLimit: 10,
        weight: p.weight,
        tags: p.tags,
        isFeatured: p.featured,
        isBestSeller: p.bestSeller,
        isTrending: p.trending,
        isFlashSale: !!p.flashSale,
        flashSalePrice: p.flashPrice ?? null,
        flashSaleEndsAt: p.flashSale ? new Date(now.getTime() + 1000 * 60 * 60 * 26) : null,
        visibility: "public",
        isActive: true,
        returnEligible: true,
        soldCount: 120 + Math.floor(Math.random() * 800),
        viewCount: 5000 + Math.floor(Math.random() * 20000),
        ratingAvg: 4.0 + Math.random() * 0.9,
        ratingCount: 10 + Math.floor(Math.random() * 60),
        seoTitle: `${p.name} | Saayo Tees`,
        seoDescription: p.short,
        categoryId: categoryMap[p.category].id,
        brandId: brandMap[p.brand].id,
        collectionId: collection.id,
        createdById: admin.id,
        attributes: {
          create: [
            { name: "Color", value: (p.colors || []).join(", ") },
            { name: "Material", value: (p.materials || []).join(", ") || "Standard" },
          ],
        },
        images: {
          create: productImages(p.name, i),
        },
        models: {
          create: [
            {
              name: p.modelName,
              url: p.model,
              format: "glb",
              fileSizeBytes: Math.floor(2400 + Math.random() * 800),
              polygonCount: 36 + (p.model.includes("oversized") ? 0 : 1),
              isDefault: true,
              arEnabled: p.ar,
              arScale: 0.25,
              cameraAngle: { theta: 30, phi: 40, radius: 3.2 },
              autoRotate: true,
              environment: "city",
              materialNodes: p.materials
                ? ["body", "sleeves", "collar", ...(p.slug === "heavyweight-pocket-tee" ? ["pocket"] : [])].map((node) => ({
                    node,
                    materials: p.materials,
                    colors: p.colors,
                    finishes: ["matte", "glossy", "metallic", "satin"],
                  }))
                : null,
            },
          ],
        },
      },
    });
    createdProducts.push(prod);

    // default variant
    await prisma.productVariant.create({
      data: {
        productId: prod.id,
        name: "Default",
        options: { color: (p.colors || ["Default"])[0], material: (p.materials || ["Standard"])[0] },
        sku: `${p.sku}-DEF`,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice ?? null,
        costPrice: p.cost,
        stockQuantity: p.stock,
        weight: p.weight,
        isDefault: true,
      },
    });

    // inventory rows
    const inventory = await prisma.inventory.create({
      data: {
        productId: prod.id,
        warehouseId: warehouse.id,
        availableQty: p.stock,
        reservedQty: 0,
      },
    });
    await prisma.inventoryLog.create({
      data: { inventoryId: inventory.id, type: "restock", quantity: p.stock, note: "Seed stock", createdById: admin.id },
    });

    // 2-4 reviews
    for (let i = 0; i < 3; i++) {
      await prisma.review.create({
        data: {
          productId: prod.id,
          userId: customer.id,
          rating: 4 + Math.floor(Math.random() * 2),
          title: ["Exactly as shown", "Best tee I own", "Love the 3D preview", "Fast delivery"][i],
          body: "The 3D configurator made color choice so easy. The fit matches the preview exactly.",
          isVerifiedPurchase: true,
          status: "approved",
        },
      });
    }
  }

  // related products
  await prisma.relatedProduct.createMany({
    data: [
      { productId: createdProducts[0].id, relatedId: createdProducts[1].id },
      { productId: createdProducts[0].id, relatedId: createdProducts[4].id },
      { productId: createdProducts[1].id, relatedId: createdProducts[0].id },
    ],
    skipDuplicates: true,
  });

  // coupons
  await prisma.coupon.createMany({
    data: [
      { code: "WELCOME10", type: "percent", value: 10, minOrderAmount: 999, maxDiscount: 500, isActive: true, perUserLimit: 1 },
      { code: "FLAT500", type: "fixed", value: 500, minOrderAmount: 2999, isActive: true },
      { code: "FREESHIP", type: "free_shipping", value: 0, minOrderAmount: 1500, isActive: true },
    ],
    skipDuplicates: true,
  });

  // banners
  await prisma.banner.createMany({
    data: [
      { title: "Custom Tees in 3D & AR", subtitle: "Try every color and fit in realistic 3D, then see it on yourself with AR", position: "home-hero", sortOrder: 0, isActive: true, link: "/shop" },
      { title: "Flash Sale", subtitle: "Up to 30% off new season tees", position: "home-section", sortOrder: 1, isActive: true, link: "/shop?sale=1" },
    ],
    skipDuplicates: true,
  });

  // pages
  await prisma.page.createMany({
    data: [
      { title: "About Us", slug: "about", content: "<p>Saayo Tees builds immersive, interactive shopping for t-shirts. Configure every tee in 3D and preview it with AR before you buy.</p>", fontFamily: "inter", status: "published" },
      { title: "Privacy Policy", slug: "privacy-policy", content: "<p>We only collect data required to deliver your orders securely.</p>", fontFamily: "inter", status: "published" },
      { title: "Terms & Conditions", slug: "terms", content: "<p>Standard e-commerce terms of service.</p>", fontFamily: "inter", status: "published" },
      { title: "Return & Refund Policy", slug: "return-refund-policy", content: "<p>7-day return window on eligible products. Tees must be unworn with tags attached.</p>", fontFamily: "inter", status: "published" },
      { title: "FAQ", slug: "faq", content: "<p>Answers to common questions about 3D configurators, AR try-on and shipping.</p>", fontFamily: "inter", status: "published" },
    ],
    skipDuplicates: true,
  });

  console.log(`✨ Seeded ${createdProducts.length} products, roles, users, coupons & pages.`);
  console.log("   Admin login:  admin@saayo.example.com / Admin@123");
  console.log("   Customer login: customer@saayo.example.com / Test@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });