import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPrice(value, currency = "INR", locale = "en-IN") {
  const num = Number(value || 0);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num);
  } catch {
    return `₹${num.toFixed(2)}`;
  }
}

export function formatDate(date, style = "medium") {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: style, timeStyle: "short" }).format(
    new Date(date)
  );
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export function paginationParams(searchParams) {
  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams?.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPagination(count, page, limit) {
  const pages = Math.max(1, Math.ceil(count / limit));
  return {
    count,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

export function getSalePrice(product) {
  if (product?.isFlashSale && product?.flashSalePrice) return product.flashSalePrice;
  if (product?.salePrice) return product.salePrice;
  return product?.regularPrice ?? 0;
}

export function getDiscountPercent(product) {
  const sale = getSalePrice(product);
  const regular = Number(product?.regularPrice ?? 0);
  if (!regular || sale >= regular) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}

export function isProductAvailable(product, qty = 1) {
  const stock = Number(product?.stockQuantity ?? 0);
  if (product?.visibility === "draft" || product?.visibility === "hidden") return false;
  if (!product?.isActive) return false;
  return stock >= qty;
}

export function orderStatusColor(status) {
  const map = {
    pending: "bg-amber-100 text-amber-800",
    payment_pending: "bg-amber-100 text-amber-800",
    payment_confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    packed: "bg-purple-100 text-purple-800",
    shipped: "bg-cyan-100 text-cyan-800",
    out_for_delivery: "bg-teal-100 text-teal-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    return_requested: "bg-orange-100 text-orange-800",
    return_approved: "bg-yellow-100 text-yellow-800",
    return_rejected: "bg-red-100 text-red-800",
    refunded: "bg-slate-200 text-slate-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    partially_refunded: "bg-orange-100 text-orange-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
    inactive: "bg-slate-200 text-slate-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, failedLoginAttempts, lockedUntil, ...safe } = user;
  return safe;
}

export function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(-4);
  return `SAY-${ts}${rand}`;
}

export function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

export function safeRedirect(value, fallback = "/") {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}