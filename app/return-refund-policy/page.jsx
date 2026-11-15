import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getStoreSettings } from "@/lib/storeSettings";
import CmsPageView from "@/components/CmsPageView";
import PageSections from "@/components/sections/PageSections";

export const revalidate = 300;

export default async function ReturnRefundPage() {
  const [page, settings] = await Promise.all([
    prisma.page.findUnique({ where: { slug: "return-refund-policy" } }),
    getStoreSettings(),
  ]);
  const policy = settings.refundPolicy?.trim();
  if (!page && !policy) notFound();

  return (
    <>
      {policy ? (
        <article className="container-x max-w-3xl py-10">
          <h1 className="mb-6 text-3xl font-black">{page?.title || "Return & Refund Policy"}</h1>
          <div className="prose-content whitespace-pre-line">{policy}</div>
        </article>
      ) : (
        <CmsPageView page={page} />
      )}
      <PageSections page="return-refund-policy" />
    </>
  );
}
