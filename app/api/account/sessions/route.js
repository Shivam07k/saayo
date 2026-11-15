import { prisma } from "@/lib/db";
import { apiRequireUser, jsonError, getSessionToken, hashSessionToken, destroySession } from "@/lib/auth";

export async function GET() {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  const token = await getSessionToken();
  const currentHash = token ? hashSessionToken(token) : null;

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tokenHash: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  const currentSessionId = currentHash ? sessions.find((s) => s.tokenHash === currentHash)?.id || null : null;
  const publicSessions = sessions.map(({ tokenHash, ...s }) => s);

  return Response.json({ sessions: publicSessions, currentSessionId });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all") === "1";
  const allOther = searchParams.get("allOther") === "1";

  const token = await getSessionToken();
  const currentHash = token ? hashSessionToken(token) : null;

  let revoked = 0;
  if (all || allOther) {
    const result = await prisma.session.deleteMany({
      where: all
        ? { userId: user.id }
        : { userId: user.id, NOT: { tokenHash: currentHash } },
    });
    revoked = result.count;
    if (all) await destroySession();
  } else if (id) {
    const session = await prisma.session.findFirst({ where: { id, userId: user.id } });
    if (!session) return jsonError("Session not found", 404);
    await prisma.session.delete({ where: { id } });
    revoked = 1;
    if (session.tokenHash === currentHash) await destroySession();
  } else {
    return jsonError("id, all, or allOther required", 400);
  }

  return Response.json({ success: true, revoked });
}