import { cache } from "react";
import { prisma } from "@/lib/db";

export const SETTING_KEYS = {
  storeName: "string",
  tagline: "string",
  logoUrl: "string",
  faviconUrl: "string",
  primaryColor: "string",
  currency: "string",
  supportPhone: "string",
  supportEmail: "string",
  address: "string",
  announcementEnabled: "boolean",
  announcementText: "string",
  announcementLink: "string",
  seoTitle: "string",
  seoDescription: "string",
  freeShippingThreshold: "number",
  shippingEnabled: "boolean",
  taxEnabled: "boolean",
  codEnabled: "boolean",
  codMinAmount: "number",
  autoApproveReviews: "boolean",
  maintenanceMode: "boolean",
  refundPolicy: "string",
  heroBadge: "string",
  footerAbout: "string",
  copyrightText: "string",
  paymentsBadge: "string",
  socialInstagram: "string",
  socialFacebook: "string",
  socialTwitter: "string",
  socialYoutube: "string",
  socialTiktok: "string",
  socialLinkedin: "string",
  socialWhatsApp: "string",
  usp1Title: "string",
  usp1Text: "string",
  usp2Title: "string",
  usp2Text: "string",
  usp3Title: "string",
  usp3Text: "string",
  usp4Title: "string",
  usp4Text: "string",
  // 3D Viewer defaults (admin-configurable)
  viewerAutoRotate: "boolean",
  viewerEnvironment: "string",
  viewerZoomMin: "number",
  viewerZoomMax: "number",
  viewerCameraTheta: "number",
  viewerCameraPhi: "number",
  viewerCameraRadius: "number",
  // Product page
  productEnable3D: "boolean",
  productEnableAR: "boolean",
  productEnableReviews: "boolean",
  productRelatedLimit: "number",
  // Checkout
  checkoutGuestEnabled: "boolean",
  checkoutShowOrderSummary: "boolean",
};

export const STORE_DEFAULTS = {
  storeName: "Saayo Tees",
  tagline: "Custom 3D T-shirt store",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#0ea5e9",
  currency: "INR",
  supportPhone: "+91 98765 43210",
  supportEmail: "hello@saayo.example.com",
  address: "123 Market Street, Mumbai 400001, India",
  announcementEnabled: false,
  announcementText: "",
  announcementLink: "",
  seoTitle: "Saayo Tees — Custom 3D T-Shirt Store",
  seoDescription:
    "Shop t-shirts — graphic tees, oversized, polos & everyday basics — with realistic 3D configurators and AR try-on before you buy.",
  freeShippingThreshold: 4999,
  shippingEnabled: true,
  taxEnabled: true,
  codEnabled: true,
  codMinAmount: 0,
  autoApproveReviews: false,
  maintenanceMode: false,
  refundPolicy: "",
  heroBadge: "New · 3D Configurator + AR Try-On",
  footerAbout:
    "Custom 3D shopping for t-shirts. Configure every tee in real time and try it on with AR before you buy.",
  copyrightText: "",
  paymentsBadge: "Stripe · Razorpay · COD",
  socialInstagram: "",
  socialFacebook: "",
  socialTwitter: "",
  socialYoutube: "",
  socialTiktok: "",
  socialLinkedin: "",
  socialWhatsApp: "https://wa.me/919876543210",
  usp1Title: "Fast Delivery",
  usp1Text: "Free shipping over ₹4999",
  usp2Title: "3D Tee Configurator",
  usp2Text: "Customize colors & fits",
  usp3Title: "Secure Payments",
  usp3Text: "Stripe, Razorpay & COD",
  usp4Title: "Easy Returns",
  usp4Text: "7-day return window",
  // 3D Viewer defaults (admin-configurable)
  viewerAutoRotate: true,
  viewerEnvironment: "city",
  viewerZoomMin: 0.5,
  viewerZoomMax: 12,
  viewerCameraTheta: 30,
  viewerCameraPhi: 40,
  viewerCameraRadius: 3.2,
  // Product page
  productEnable3D: true,
  productEnableAR: true,
  productEnableReviews: true,
  productRelatedLimit: 4,
  // Checkout
  checkoutGuestEnabled: true,
  checkoutShowOrderSummary: true,
};

export const getStoreSettings = cache(async () => {
  const rows = await prisma.storeSetting.findMany({
    where: { key: { in: Object.keys(SETTING_KEYS) } },
  });
  const settings = { ...STORE_DEFAULTS };
  for (const row of rows) {
    const type = SETTING_KEYS[row.key];
    settings[row.key] =
      type === "number"
        ? Number(row.value)
        : type === "boolean"
          ? row.value === "true"
          : row.value;
  }
  return settings;
});