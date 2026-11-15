import { describe, it, expect } from "vitest";
import {
  slugify,
  getSalePrice,
  getDiscountPercent,
  isProductAvailable,
  buildPagination,
  paginationParams,
  sanitizeUser,
  generateOrderNumber,
} from "../lib/utils";

describe("slugify", () => {
  it("lowercases and trims", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });
  it("strips non-alphanumeric characters", () => {
    expect(slugify("Nordå Utility Shelf !!!")).toBe("nord-utility-shelf");
  });
  it("collapses separators", () => {
    expect(slugify("a--b___c d")).toBe("a-b-c-d");
  });
  it("removes leading/trailing dashes", () => {
    expect(slugify("--abc--")).toBe("abc");
  });
});

describe("getSalePrice", () => {
  it("uses flash sale price when active", () => {
    const p = { regularPrice: 100, salePrice: 80, isFlashSale: true, flashSalePrice: 60 };
    expect(getSalePrice(p)).toBe(60);
  });
  it("prefers sale price otherwise", () => {
    expect(getSalePrice({ regularPrice: 100, salePrice: 80 })).toBe(80);
  });
  it("falls back to regular price", () => {
    expect(getSalePrice({ regularPrice: 100 })).toBe(100);
  });
});

describe("getDiscountPercent", () => {
  it("computes integer discount percent", () => {
    expect(getDiscountPercent({ regularPrice: 100, salePrice: 75 })).toBe(25);
  });
  it("returns 0 when no markdown", () => {
    expect(getDiscountPercent({ regularPrice: 100 })).toBe(0);
    expect(getDiscountPercent({ regularPrice: 100, salePrice: 120 })).toBe(0);
  });
});

describe("isProductAvailable", () => {
  const base = { isActive: true, visibility: "public", stockQuantity: 5 };
  it("true when in stock and active", () => {
    expect(isProductAvailable(base, 3)).toBe(true);
  });
  it("false when out of stock", () => {
    expect(isProductAvailable(base, 6)).toBe(false);
    expect(isProductAvailable({ ...base, stockQuantity: 0 }, 1)).toBe(false);
  });
  it("false when inactive or hidden/draft", () => {
    expect(isProductAvailable({ ...base, isActive: false })).toBe(false);
    expect(isProductAvailable({ ...base, visibility: "hidden" })).toBe(false);
    expect(isProductAvailable({ ...base, visibility: "draft" })).toBe(false);
  });
});

describe("pagination helpers", () => {
  it("clamps page to min 1", () => {
    expect(paginationParams({ page: "0" }).page).toBe(1);
  });
  it("clamps limit to 1..100 default 12", () => {
    expect(paginationParams({}).limit).toBe(12);
    expect(paginationParams({ limit: "999" }).limit).toBe(100);
  });
  it("builds hasNext/hasPrev correctly", () => {
    const p = buildPagination(25, 2, 10);
    expect(p).toMatchObject({ count: 25, page: 2, pages: 3, hasNext: true, hasPrev: true });
    expect(buildPagination(5, 1, 10).hasNext).toBe(false);
    expect(buildPagination(5, 1, 10).hasPrev).toBe(false);
  });
});

describe("sanitizeUser", () => {
  it("strips sensitive fields", () => {
    const safe = sanitizeUser({ name: "A", passwordHash: "x", failedLoginAttempts: 3, lockedUntil: null, email: "a@b.c" });
    expect(safe).toEqual({ name: "A", email: "a@b.c" });
  });
  it("returns null for empty input", () => {
    expect(sanitizeUser(null)).toBe(null);
  });
});

describe("generateOrderNumber", () => {
  it("produces SAY- prefixed order numbers", () => {
    const n = generateOrderNumber();
    expect(n).toMatch(/^SAY-[A-Z0-9]{8,}$/);
  });
  it("is unique across calls", () => {
    expect(generateOrderNumber()).not.toBe(generateOrderNumber());
  });
});