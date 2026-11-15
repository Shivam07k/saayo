import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CmsPageView from "@/components/CmsPageView";
import PageSections from "@/components/sections/PageSections";

export const revalidate = 300;

export default async function PrivacyPolicyPage() {
  const page = await prisma.page.findUnique({ where: { slug: "privacy-policy" } });
  if (!page) notFound();
  return (
    <>
      <CmsPageView page={page} />
      <PageSections page="privacy-policy" />
    </>
  );
}