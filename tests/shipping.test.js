import { describe, it, expect } from "vitest";
import { getShippingRates, calculateShipping } from "../lib/shipping";

describe("getShippingRates", () => {
  it("applies defaults when no settings passed", async () => {
    expect(await getShippingRates()).toEqual({ flatRate: 99, freeShippingThreshold: 4999, weightKgRate: 40 });
  });
  it("merges provided settings", async () => {
    const rates = await getShippingRates({ flatRate: 49 });
    expect(rates.flatRate).toBe(49);
    expect(rates.freeShippingThreshold).toBe(4999);
  });
});

describe("calculateShipping", () => {
  const items = [{ weight: 1, quantity: 2 }];

  it("free when subtotal above threshold", async () => {
    const r = await calculateShipping({ items, subtotal: 5000 });
    expect(r.cost).toBe(0);
    expect(r.provider).toBe("Free Shipping");
  });

  it("flat rate for small orders", async () => {
    const r = await calculateShipping({ items, subtotal: 1000 });
    expect(r.cost).toBe(99);
    expect(r.provider).toBe("Standard Shipping");
  });

  it("bills heavier-than-flat weight cost", async () => {
    const heavy = await calculateShipping({ items: [{ weight: 10, quantity: 2 }], subtotal: 1000 });
    expect(heavy.cost).toBe(800); // 20kg * 40/kg
  });

  it("reports mg-estimated days by country", async () => {
    const india = await calculateShipping({ items, subtotal: 1000, country: "India" });
    const abroad = await calculateShipping({ items, subtotal: 1000, country: "USA" });
    expect(india.estimatedDays).toContain("2-4");
    expect(abroad.estimatedDays).toContain("7-14");
  });
});