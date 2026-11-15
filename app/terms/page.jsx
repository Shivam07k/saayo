import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CmsPageView from "@/components/CmsPageView";
import PageSections from "@/components/sections/PageSections";

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const page = await prisma.page.findUnique({ where: { slug: "terms" } });
  if (!page) notFound();
  return (
    <>
      <CmsPageView page={page} />
      <PageSections page="terms" />
    </>
  );
}