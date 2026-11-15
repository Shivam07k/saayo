import Link from "next/link";
import { prisma } from "@/lib/db";
import { ChevronRight, HelpCircle, ChevronDown } from "lucide-react";
import { fontCss } from "@/lib/fonts";
import PageSections from "@/components/sections/PageSections";

export const revalidate = 300;

export default async function FaqPage() {
  const page = await prisma.page.findUnique({ where: { slug: "faq" } });

  const faqs = [
    { q: "How does the 3D viewer work?", a: "Every product with a 3D model lets you rotate 360°, zoom, and pan. Use the configurator to change colors, materials and finishes live." },
    { q: "Can I see how the tee looks before buying?", a: "Yes! Tap 'Preview in AR' on a supported mobile device to place the tee in the real world, scaled to real size. Requires WebXR (Android/Chrome) or iOS 12+ Quick Look." },
    { q: "What payment methods are supported?", a: "Card payments via Stripe, UPI/cards/netbanking via Razorpay, and Cash on Delivery." },
    { q: "What is your return policy?", a: "Most products can be returned within 7 days of delivery. See the Return & Refund Policy for details." },
    { q: "Are the 3D models accurate?", a: "Models are authored from real product measurements and PBR materials so colors and proportions are realistic." },
  ];

  return (
    <div className="container-x max-w-3xl py-10">
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">FAQ</span>
      </nav>
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-black"><HelpCircle className="h-7 w-7 text-brand-600" /> Frequently Asked Questions</h1>

      <div className="space-y-3" style={{ fontFamily: fontCss(page?.fontFamily) }}>
        {faqs.map((f, i) => (
          <details key={i} className="card group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              {f.q}
              <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>

      {page && <div className="prose-content mt-8" dangerouslySetInnerHTML={{ __html: page.content }} />}
      <PageSections page="faq" />
    </div>
  );
}