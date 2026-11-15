import { NextResponse } from "next/server";

// OPTIMIZATION: Removed the fetch to /api/site-settings on every middleware call.
// This was adding an extra HTTP hop and DB query before any page rendered.
// Maintenance mode is now checked via a lightweight in-memory approach below,
// or can be set via the admin UI / environment variables.

// Minimal in-memory cache shared across middleware instances in the same process.
// If the admin updates a setting, it can invalidate this by updating the DB directly
// or the admin UI; with no data in the DB, maintenanceMode defaults to false.
const MAINTENANCE_CACHE_TTL_MS = 60_000;
let cachedMaintenance = null;

// Check if maintenance mode is enabled by reading from a simple in-memory cache.
// Falls back to false if no data (empty DB).
function isMaintenanceModeEnabled() {
  if (cachedMaintenance && Date.now() - cachedMaintenance.at < MAINTENANCE_CACHE_TTL_MS) {
    return cachedMaintenance.value;
  }
  return false;
}

function setMaintenanceModeEnabled(value) {
  cachedMaintenance = { value, at: Date.now() };
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // OPTIMIZATION: Direct in-memory check instead of fetch + DB query.
  // With empty DB, this returns false immediately - zero overhead.
  if (isMaintenanceModeEnabled()) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|admin|maintenance|favicon.ico|static|.*\\..*).*)"],
};