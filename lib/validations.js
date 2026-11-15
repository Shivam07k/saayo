import { z } from "zod";

export const MOBILE_REGEX = /^[+]?[0-9\s-]{8,15}$/;

export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens");

export const registerSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters").max(80),
  email: z.string().email("Enter a valid email").max(120),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().regex(MOBILE_REGEX, "Enter a valid phone number").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(MOBILE_REGEX, "Enter a valid phone number").optional().or(z.literal("")),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["shipping", "billing"]).default("shipping"),
  label: z.string().max(40).optional(),
  fullName: z.string().min(2).max(80),
  phone: z.string().regex(MOBILE_REGEX, "Enter a valid phone number"),
  line1: z.string().min(3).max(160),
  line2: z.string().max(160).optional().or(z.literal("")),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  postalCode: z.string().min(3).max(12),
  country: z.string().min(2).max(60).default("India"),
  isDefault: z.boolean().default(false),
});

const money = z.coerce.number().min(0, "Price cannot be negative").max(1e9);

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  options: z.record(z.string()).optional(),
  sku: z.string().min(1).max(64),
  barcode: z.string().max(64).optional().or(z.literal("")),
  regularPrice: money,
  salePrice: money.optional().nullable(),
  costPrice: money.optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0),
  weight: z.coerce.number().optional().nullable(),
  lengthCm: z.coerce.number().optional().nullable(),
  widthCm: z.coerce.number().optional().nullable(),
  heightCm: z.coerce.number().optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(2, "Name is required").max(160),
  slug: slugSchema,
  shortDescription: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(10000).optional().or(z.literal("")),
  sku: z.string().min(1).max(64),
  barcode: z.string().max(64).optional().or(z.literal("")),
  regularPrice: money,
  salePrice: money.optional().nullable(),
  costPrice: money.optional().nullable(),
  taxPercent: z.coerce.number().min(0).max(100).optional().default(0),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockLimit: z.coerce.number().int().min(0).optional().default(5),
  weight: z.coerce.number().optional().nullable(),
  lengthCm: z.coerce.number().optional().nullable(),
  widthCm: z.coerce.number().optional().nullable(),
  heightCm: z.coerce.number().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  seoTitle: z.string().max(160).optional().or(z.literal("")),
  seoDescription: z.string().max(300).optional().or(z.literal("")),
  isFeatured: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isTrending: z.boolean().optional().default(false),
  isFlashSale: z.boolean().optional().default(false),
  flashSalePrice: money.optional().nullable(),
  flashSaleEndsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  visibility: z.enum(["public", "hidden", "draft", "scheduled"]).optional().default("public"),
  scheduledAt: z.string().datetime().optional().nullable(),
  warranty: z.string().max(200).optional().or(z.literal("")),
  returnEligible: z.boolean().optional().default(true),
  returnDays: z.coerce.number().int().min(0).max(90).optional().default(7),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  brandId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  collectionId: z.string().optional().nullable(),
  images: z.array(z.object({ url: z.string(), alt: z.string().optional(), position: z.number() })),
  attributes: z.array(z.object({ name: z.string().min(1), value: z.string().min(1) })).optional().default([]),
  relatedIds: z.array(z.string()).optional().default([]),
  variants: z.array(variantSchema).optional().default([]),
  models: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    url: z.string().min(1),
    format: z.enum(["glb", "gltf"]),
    isDefault: z.boolean().optional().default(false),
    arEnabled: z.boolean().optional().default(true),
    arScale: z.coerce.number().optional().default(1),
    cameraAngle: z.record(z.coerce.number()).optional(),
    autoRotate: z.boolean().optional().default(true),
    environment: z.string().optional().default("city"),
  })).optional().default([]),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(99),
  configuration: z.record(z.any()).optional().nullable(),
});

export const cartUpdateSchema = z.object({
  itemId: z.string(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(MOBILE_REGEX).optional().or(z.literal("")),
  shippingAddressId: z.string().optional(),
  shippingAddress: addressSchema.optional(),
  billingAddressId: z.string().optional(),
  useBillingForShipping: z.boolean().optional().default(true),
  couponCode: z.string().max(40).optional().or(z.literal("")),
  paymentMethod: z.enum(["stripe", "razorpay", "cod"]),
  notes: z.string().max(500).optional().or(z.literal("")),
  createAccount: z.boolean().optional().default(false),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(5).max(2000),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(40).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  type: z.enum(["fixed", "percent", "free_shipping"]),
  value: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  perUserLimit: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  productIds: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).optional().default([]),
  customerEmails: z.array(z.string().email()).optional().default([]),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: slugSchema,
  description: z.string().max(300).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")).nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export const brandSchema = z.object({
  name: z.string().min(2).max(80),
  slug: slugSchema,
  logo: z.string().url().optional().or(z.literal("")).nullable(),
  description: z.string().max(300).optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

export const bannerSchema = z.object({
  title: z.string().min(2).max(120),
  subtitle: z.string().max(300).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")).nullable(),
  link: z.string().max(200).optional().or(z.literal("")),
  position: z.string().default("home-hero"),
  sortOrder: z.coerce.number().int().optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const inventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  type: z.enum(["adjustment", "restock", "reserved"]),
  quantity: z.coerce.number().int().min(-1e6).max(1e6),
  note: z.string().max(300).optional(),
});

export const modelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  url: z.string().min(1),
  format: z.enum(["glb", "gltf"]),
  fileSizeBytes: z.coerce.number().min(0).optional(),
  isDefault: z.boolean().optional(),
  arEnabled: z.boolean().optional(),
  arScale: z.coerce.number().min(0.01).max(100).optional(),
  cameraAngle: z.record(z.coerce.number()).optional(),
  autoRotate: z.boolean().optional(),
  zoomMin: z.coerce.number().min(0.1).optional(),
  zoomMax: z.coerce.number().min(0.1).optional(),
  environment: z.string().optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "pending", "payment_pending", "payment_confirmed", "processing", "packed",
    "shipped", "out_for_delivery", "delivered", "cancelled",
  ]),
  trackingNumber: z.string().max(120).optional().or(z.literal("")),
  shippingProvider: z.string().max(80).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const refundSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().max(500).optional().or(z.literal("")),
  fullRefund: z.boolean().optional().default(false),
});