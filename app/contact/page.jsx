import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CmsPageView from "@/components/CmsPageView";
import StoreLocationMap from "@/components/StoreLocationMap";
import { getStoreSettings } from "@/lib/storeSettings";
import PageSections from "@/components/sections/PageSections";

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const page = await prisma.page.findUnique({ where: { slug: "contact" } });
  if (!page) notFound();
  const settings = await getStoreSettings();
  return (
    <div>
      <CmsPageView page={page} />
      <StoreLocationMap address={settings.address} />
      <PageSections page="contact" />
    </div>
  );
}