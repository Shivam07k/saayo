export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Optional Google OAuth. Requires NEXT_PUBLIC_GOOGLE_ENABLED=true and the
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars.
// shortcut: the /callback leg is not implemented, so this is inert until it is; do not enable Google without it.
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || process.env.NEXT_PUBLIC_GOOGLE_ENABLED !== "true") {
    return new Response("Google sign-in is not enabled.", { status: 404 });
  }
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`;
  const scope = "openid email profile";
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&prompt=select_account`;
  return Response.redirect(url, 302);
}
