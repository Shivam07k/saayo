// Pure constants: safe to import from client components (no Prisma).
export const SECTION_TYPE_VALUES = [
  "hero", "usps", "flash-sale", "category-grid", "feature-banner",
  "new-arrivals", "best-sellers", "trending", "recommended", "reviews",
  "newsletter", "banner", "product-grid", "custom-html",
];

export const SECTION_TYPES = {
  "hero": { label: "Hero Banner", description: "Big title, subtitle and call-to-action buttons." },
  "usps": { label: "USP Strip", description: "Store benefits strip (delivery, payments, returns)." },
  "flash-sale": { label: "Flash Sale", description: "On-sale flash products with countdown." },
  "category-grid": { label: "Categories", description: "Shop-by-category tiles." },
  "feature-banner": { label: "Feature Banner", description: "Promo banner with image and link." },
  "new-arrivals": { label: "New Arrivals", description: "Latest added products." },
  "best-sellers": { label: "Best Sellers", description: "Top selling products." },
  "trending": { label: "Trending", description: "Trending products." },
  "recommended": { label: "Recommended", description: "Featured products." },
  "reviews": { label: "Reviews", description: "Customer testimonials." },
  "newsletter": { label: "Newsletter", description: "Email signup band (10% off)." },
  "banner": { label: "Custom Banner", description: "Image/HTML banner with link button." },
  "product-grid": { label: "Product Grid", description: "Products from a category, collection or brand." },
  "custom-html": { label: "Custom HTML", description: "Free-form HTML block." },
};

export const SECTION_PAGES = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
  { value: "faq", label: "FAQ" },
  { value: "terms", label: "Terms" },
  { value: "privacy-policy", label: "Privacy Policy" },
  { value: "return-refund-policy", label: "Returns & Refunds" },
];
