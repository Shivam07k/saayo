import { prisma } from "@/lib/db";
import { publicProductCardInclude } from "@/lib/queries";

// ============ SECTION BUILDER — core ============
// Sections let admins add / edit / reorder / show/hide blocks on pages.
// A section = (page, type, title, subtitle, config, sortOrder, isActive).

export { SECTION_TYPE_VALUES, SECTION_TYPES, SECTION_PAGES } from "@/lib/sectionTypes";

// Order + defaults that reconstruct the original home layout when no rows exist.
export const DEFAULT_HOME_SECTIONS = [
  { id: "default-hero", page: "home", type: "hero", title: "Design your tee in 3D, wear it for real", subtitle: "Rotate every tee 360°, customize colors and materials in real time, then preview it on yourself with AR before you order.", config: { badge: "New · 3D Configurator + AR Try-On", primaryButtonLabel: "Start Shopping", primaryButtonLink: "/shop", secondaryButtonLabel: "Customize a Tee", secondaryButtonLink: "/shop?sort=featured", gradientFrom: "#4f46e5", gradientTo: "#4338ca" }, sortOrder: 0 },
  { id: "default-usps", page: "home", type: "usps", title: null, subtitle: null, config: {}, sortOrder: 1 },
  { id: "default-flash-sale", page: "home", type: "flash-sale", title: "Flash Sale", subtitle: "Limited time deals — grab them before they're gone.", config: { badge: "Limited time" }, sortOrder: 2 },
  { id: "default-category-grid", page: "home", type: "category-grid", title: "Shop by Category", subtitle: null, config: {}, sortOrder: 3 },
  { id: "default-feature-banner", page: "home", type: "feature-banner", title: null, subtitle: null, config: {}, sortOrder: 4 },
  { id: "default-new-arrivals", page: "home", type: "new-arrivals", title: "New Arrivals", subtitle: "Just dropped — fresh styles for the season.", config: {}, sortOrder: 5 },
  { id: "default-best-sellers", page: "home", type: "best-sellers", title: "Best Sellers", subtitle: "The tees everyone is talking about.", config: {}, sortOrder: 6 },
  { id: "default-trending", page: "home", type: "trending", title: "Trending Now", subtitle: null, config: {}, sortOrder: 7 },
  { id: "default-recommended", page: "home", type: "recommended", title: "Recommended for You", subtitle: "Picks based on what shoppers love.", config: {}, sortOrder: 8 },
  { id: "default-reviews", page: "home", type: "reviews", title: "What Customers Say", subtitle: null, config: {}, sortOrder: 9 },
  { id: "default-newsletter", page: "home", type: "newsletter", title: "Get 10% off your first order", subtitle: "Join our newsletter for new drops, member-only sales and style guides.", config: {}, sortOrder: 10 },
];

export async function getSections(page = "home") {
  const rows = await prisma.section.findMany({
    where: { page, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length === 0 && page === "home") {
    return DEFAULT_HOME_SECTIONS.map((s) => ({ ...s, isActive: true }));
  }
  return rows;
}

export async function getAllSections() {
  return prisma.section.findMany({
    orderBy: [{ page: "asc" }, { sortOrder: "asc" }],
  });
}

// Featured product sets used by product-grid / product sections.
export async function getProductSet({ source = "newest", ref = null, limit = 8 } = {}) {
  const where = { isActive: true, visibility: "public" };
  let orderBy = { createdAt: "desc" };
  switch (source) {
    case "featured":
      where.isFeatured = true;
      orderBy = { soldCount: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "best-sellers":
      orderBy = { soldCount: "desc" };
      break;
    case "trending":
      where.isTrending = true;
      orderBy = { soldCount: "desc" };
      break;
    case "flash-sale":
      where.isFlashSale = true;
      where.flashSaleEndsAt = { gt: new Date() };
      orderBy = { soldCount: "desc" };
      break;
    case "category":
      where.category = { slug: ref };
      break;
    case "brand":
      where.brand = { slug: ref };
      break;
    case "collection":
      where.collection = { slug: ref };
      break;
    default:
      break;
  }
  return prisma.product.findMany({
    where,
    orderBy,
    take: Math.min(Number(limit) || 8, 20),
    include: publicProductCardInclude,
  });
}