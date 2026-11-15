import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CmsPageView from "@/components/CmsPageView";
import PageSections from "@/components/sections/PageSections";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return {};
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function DynamicPage({ params }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({
    where: { slug },
  });
  if (!page || page.status !== "published") notFound();
  return (
    <>
      <CmsPageView page={page} />
      <PageSections page={slug} />
    </>
  );
}