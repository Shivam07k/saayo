import { prisma } from "@/lib/db";

const INDIA_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const SERVICEABLE_PREFIXES = {
  "11": { state: "Delhi", city: "New Delhi", days: "2-3" },
  "40": { state: "Maharashtra", city: "Mumbai", days: "2-3" },
  "56": { state: "Karnataka", city: "Bangalore", days: "2-4" },
  "60": { state: "Tamil Nadu", city: "Chennai", days: "3-5" },
  "70": { state: "West Bengal", city: "Kolkata", days: "3-5" },
  "50": { state: "Telangana", city: "Hyderabad", days: "3-5" },
  "38": { state: "Gujarat", city: "Ahmedabad", days: "3-5" },
  "30": { state: "Rajasthan", city: "Jaipur", days: "3-5" },
  "20": { state: "Uttar Pradesh", city: "Lucknow", days: "4-6" },
  "14": { state: "Punjab", city: "Ludhiana", days: "4-6" },
  "46": { state: "Madhya Pradesh", city: "Bhopal", days: "4-6" },
  "41": { state: "Maharashtra", city: "Pune", days: "2-4" },
  "80": { state: "Bihar", city: "Patna", days: "5-7" },
  "75": { state: "Odisha", city: "Bhubaneswar", days: "5-7" },
  "68": { state: "Kerala", city: "Kochi", days: "3-5" },
  "69": { state: "Kerala", city: "Trivandrum", days: "3-5" },
};

const DEFAULT_DAYS = "5-8";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode")?.trim();

  if (!pincode) {
    return Response.json({ error: "Pincode is required" }, { status: 400 });
  }

  if (!INDIA_PINCODE_REGEX.test(pincode)) {
    return Response.json(
      { serviceable: false, message: "Please enter a valid 6-digit Indian pincode" },
      { status: 200 }
    );
  }

  try {
    const zonesRow = await prisma.storeSetting.findFirst({
      where: { key: "shipping.zones" },
    });
    const zones = JSON.parse(zonesRow?.value || "[]");

    if (zones.length > 0) {
      const prefix = pincode.substring(0, 2);
      const zoneMatch = zones.find((z) => {
        const countries = (z.countries || "").toLowerCase();
        return countries.includes(prefix) || countries.includes("all") || countries.includes("india");
      });

      if (zoneMatch) {
        return Response.json({
          serviceable: true,
          message: `Delivery available`,
          estimatedDays: `${zoneMatch.minDays || 3}-${zoneMatch.maxDays || 7} business days`,
          zone: zoneMatch.name || "Standard",
        });
      }

      if (!zoneMatch) {
        return Response.json({
          serviceable: false,
          message: "Sorry, delivery is not available for this pincode",
        });
      }
    }

    const prefix = pincode.substring(0, 2);
    const match = SERVICEABLE_PREFIXES[prefix];

    if (match) {
      return Response.json({
        serviceable: true,
        message: `Delivery available to ${match.city}, ${match.state}`,
        estimatedDays: `${match.days} business days`,
        zone: "India",
      });
    }

    return Response.json({
      serviceable: true,
      message: "Delivery available to your location",
      estimatedDays: `${DEFAULT_DAYS} business days`,
      zone: "India",
    });
  } catch {
    return Response.json({
      serviceable: true,
      message: "Delivery available to your location",
      estimatedDays: `${DEFAULT_DAYS} business days`,
      zone: "India",
    });
  }
}
