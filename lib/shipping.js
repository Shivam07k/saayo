// Store money rules (shipping + tax), configurable via StoreSetting.
// computeShippingCost / computeTax are pure so the checkout summary and the
// server charge the exact same number.
export const DEFAULT_RATES = {
  flatRate: 99,
  freeShippingThreshold: 4999,
  weightKgRate: 40,
};

export async function getShippingRates(settings) {
  const s = settings || DEFAULT_RATES;
  return {
    flatRate: Number(s.flatRate ?? DEFAULT_RATES.flatRate),
    freeShippingThreshold: Number(s.freeShippingThreshold ?? DEFAULT_RATES.freeShippingThreshold),
    weightKgRate: Number(s.weightKgRate ?? DEFAULT_RATES.weightKgRate),
  };
}

export function computeShippingCost({ items = [], subtotal = 0, settings }) {
  if (settings?.shippingEnabled === false) return 0;
  const rates = {
    flatRate: Number(settings?.flatRate ?? DEFAULT_RATES.flatRate),
    freeShippingThreshold: Number(settings?.freeShippingThreshold ?? DEFAULT_RATES.freeShippingThreshold),
    weightKgRate: Number(settings?.weightKgRate ?? DEFAULT_RATES.weightKgRate),
  };
  if (subtotal >= rates.freeShippingThreshold) return 0;
  // cart lines carry weight on the product; older callers put it on the line
  const totalWeight = items.reduce((acc, it) => acc + Number(it.product?.weight ?? it.weight ?? 0) * it.quantity, 0);
  return Math.max(rates.flatRate, Math.round(totalWeight * rates.weightKgRate));
}

// `items` must carry a numeric `unitPrice` (client: getItemPrice, server: getUnitPrice).
export function computeTax({ items = [], subtotal = 0, discount = 0, settings }) {
  if (settings?.taxEnabled === false) return 0;
  const taxableBase = Math.max(0, subtotal - discount);
  return items.reduce((s, i) => {
    const line = Number(i.unitPrice || 0) * i.quantity;
    const taxPct = Number(i.product?.taxPercent || 0) / 100;
    return s + (line / (subtotal || 1)) * taxableBase * taxPct;
  }, 0);
}

export async function calculateShipping({ items, subtotal, country = "India", settings }) {
  const rates = await getShippingRates(settings);
  const totalWeight = items.reduce((acc, it) => acc + Number(it.product?.weight ?? it.weight ?? 0) * it.quantity, 0);
  const cost = computeShippingCost({ items, subtotal, settings });

  return {
    provider: cost === 0 ? "Free Shipping" : "Standard Shipping",
    cost,
    freeShippingThreshold: rates.freeShippingThreshold,
    totalWeightKg: totalWeight,
    estimatedDays: country === "India" ? "2-4 business days" : "7-14 business days",
  };
}
