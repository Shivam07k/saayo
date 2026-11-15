import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

const SLUG_META = {
  "about": { title: "About Us" },
  "contact": { title: "Contact Us" },
  "faq": { title: "FAQ" },
  "privacy-policy": { title: "Privacy Policy" },
  "terms": { title: "Terms & Conditions" },
  "return-refund-policy": { title: "Returns & Refunds" },
  "shipping-policy": { title: "Shipping Policy" },
};

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "pages:manage" });
  if (error) return jsonError(error, status);
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
  return Response.json({ pages, defaults: SLUG_META });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "pages:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.title || !data.slug) return jsonError("Title and slug required", 400);
  const page = await prisma.page.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content || "",
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      fontFamily: data.fontFamily || "inter",
      status: data.status || "draft",
    },
  });
  return Response.json({ page }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "pages:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);
  const page = await prisma.page.update({
    where: { id: data.id },
    data: {
      title: data.title !== undefined ? data.title : undefined,
      slug: data.slug !== undefined ? data.slug : undefined,
      content: data.content !== undefined ? data.content : undefined,
      seoTitle: data.seoTitle !== undefined ? data.seoTitle : undefined,
      seoDescription: data.seoDescription !== undefined ? data.seoDescription : undefined,
      fontFamily: data.fontFamily !== undefined ? data.fontFamily : undefined,
      status: data.status !== undefined ? data.status : undefined,
    },
  });
  return Response.json({ page });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "pages:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.page.delete({ where: { id } });
  return Response.json({ success: true });
}