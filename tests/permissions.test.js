import { describe, it, expect } from "vitest";
import { isAdmin, PERMISSIONS } from "../lib/permissions";

describe("isAdmin", () => {
  it("rejects shoppers and anonymous visitors", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin({ roleName: "Customer", permissions: [] })).toBe(false);
  });

  it("accepts super admins and any single admin permission", () => {
    expect(isAdmin({ roleName: "Super Admin", permissions: [] })).toBe(true);
    expect(isAdmin({ roleName: "Customer Support", permissions: [PERMISSIONS.ORDERS_VIEW] })).toBe(true);
  });
});
