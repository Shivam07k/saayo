import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, addressSchema, checkoutSchema, reviewSchema, couponSchema } from "../lib/validations";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "secret123" }).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "secret123" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = { name: "Test User", email: "t@b.com", phone: "+919999999999", password: "StrongPass1!" };
  it("accepts valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects weak password", () => {
    expect(registerSchema.safeParse({ ...valid, password: "abcdef" }).success).toBe(false);
  });
});

describe("addressSchema", () => {
  const valid = {
    fullName: "Test User",
    phone: "+919999999999",
    line1: "1 Main Street",
    city: "Delhi",
    state: "DL",
    postalCode: "110001",
    country: "India",
  };
  it("accepts valid address", () => {
    expect(addressSchema.safeParse(valid).success).toBe(true);
  });
  it("defaults type to shipping", () => {
    expect(addressSchema.parse(valid).type).toBe("shipping");
  });
  it("rejects missing postalCode", () => {
    const { postalCode, ...rest } = valid;
    expect(addressSchema.safeParse(rest).success).toBe(false);
  });
  it("rejects bad phone", () => {
    expect(addressSchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const valid = {
    email: "customer@saayo.example.com",
    phone: "+919999999999",
    shippingAddress: {
      fullName: "Test User",
      phone: "+919999999999",
      line1: "1 Main Street",
      city: "Delhi",
      state: "DL",
      postalCode: "110001",
      country: "India",
    },
    paymentMethod: "cod",
  };
  it("accepts COD payload", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });
  it("defaults useBillingForShipping true", () => {
    expect(checkoutSchema.parse(valid).useBillingForShipping).toBe(true);
  });
  it("rejects unknown payment method", () => {
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: "bitcoin" }).success).toBe(false);
  });
  it("rejects invalid email", () => {
    expect(checkoutSchema.safeParse({ ...valid, email: "x" }).success).toBe(false);
  });
  it("accepts saved-address reference without address object", () => {
    const r = checkoutSchema.safeParse({ email: valid.email, shippingAddressId: "addr_1", paymentMethod: "cod" });
    expect(r.success).toBe(true);
  });
});

describe("reviewSchema", () => {
  it("accepts valid review", () => {
    expect(reviewSchema.safeParse({ productId: "p1", rating: 5, title: "Great", body: "Really love this product" }).success).toBe(true);
  });
  it("rejects rating out of range", () => {
    expect(reviewSchema.safeParse({ productId: "p1", rating: 6, body: "Too good" }).success).toBe(false);
    expect(reviewSchema.safeParse({ productId: "p1", rating: 0, body: "Too bad" }).success).toBe(false);
  });
  it("rejects too-short body", () => {
    expect(reviewSchema.safeParse({ productId: "p1", rating: 4, body: "ok" }).success).toBe(false);
  });
});

describe("couponSchema", () => {
  it("requires uppercase code", () => {
    expect(couponSchema.safeParse({ code: "welcome10", type: "percent", value: 10 }).success).toBe(false);
    expect(couponSchema.safeParse({ code: "WELCOME10", type: "percent", value: 10 }).success).toBe(true);
  });
  it("supports all coupon types", () => {
    for (const type of ["fixed", "percent", "free_shipping"]) {
      expect(couponSchema.safeParse({ code: "SAVE20", type, value: 20 }).success).toBe(true);
    }
  });
});