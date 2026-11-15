import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Rocket, Shirt, ShieldCheck, RotateCcw, Truck, TrendingUp, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { toPlain } from "@/lib/utils";
import { getStoreSettings } from "@/lib/storeSettings";
import { getProductSet } from "@/lib/sections";
import ProductGrid from "@/components/ProductGrid";
import CategoryMenu from "@/components/CategoryMenu";
import CountdownTimer from "@/components/CountdownTimer";
import RatingStars from "@/components/RatingStars";
import { NewsletterForm } from "@/components/NewsletterForm";

async function getSettings() {
  return getStoreSettings();
}

export default async function SectionRenderer({ section }) {
  const type = section?.type;
  if (!type) return null;

  switch (type) {
    case "hero": return <HeroSection section={section} />;
    case "usps": return <UspsSection />;
    case "flash-sale": return <FlashSaleSection section={section} />;
    case "category-grid": return <CategorySection section={section} />;
    case "feature-banner": return <FeatureBannerSection section={section} />;
    case "new-arrivals": return <ProductListSection section={section} source="newest" icon={null} />;
    case "best-sellers": return <ProductListSection section={section} source="best-sellers" icon={null} />;
    case "trending": return <ProductListSection section={section} source="trending" icon={<TrendingUp className="h-5 w-5 text-red-500" />} tinted />;
    case "recommended": return <ProductListSection section={section} source="featured" icon={<Sparkles className="h-5 w-5 text-amber-500" />} />;
    case "reviews": return <ReviewsSection section={section} />;
    case "newsletter": return <NewsletterSection section={section} />;
    case "banner": return <BannerSection section={section} />;
    case "product-grid": return <ProductListSection section={section} source={section.config?.source || "newest"} icon={null} />;
    case "custom-html": return <HtmlSection section={section} />;
    default: return null;
  }
}

function SectionHeader({ title, subtitle, href }) {
  if (!title && !subtitle) return null;
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {title && <h2 className="text-xl font-black sm:text-2xl">{title}</h2>}
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="btn-ghost text-sm font-semibold text-brand-600 dark:text-brand-400">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Shell({ children, className = "", tinted = false }) {
  return <section className={`container-x py-10 ${tinted ? "!py-8" : ""} ${className}`}>{children}</section>;
}

// ---------- Hero ----------
async function HeroSection({ section }) {
  const s = await getSettings();
  const cfg = section.config || {};
  const title = section.title || "Design your tee in 3D";
  const subtitle = section.subtitle || "Rotate every tee 360°, customize colors and materials in real time.";
  const badge = cfg.badge || s.heroBadge || "New · 3D Configurator + AR Try-On";
  const from = cfg.gradientFrom || "#4f46e5";
  const to = cfg.gradientTo || "#4338ca";
  return (
    <section className="relative overflow-hidden text-white" style={{ backgroundImage: `linear-gradient(to bottom right, ${from}, ${to})` }}>
      {cfg.image && (
        <Image src={cfg.image} alt="" fill
          sizes="100vw"
          className="pointer-events-none absolute inset-0 object-cover opacity-30"
          priority />
      )}
      <div className="container-x flex min-h-[420px] flex-col items-center justify-center py-16 text-center">
        <span className="mb-4 flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
          <Rocket className="h-4 w-4" /> {badge}
        </span>
        <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-xl text-lg">{subtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {cfg.primaryButtonLabel && (
            <Link href={cfg.primaryButtonLink || "/shop"} className="btn bg-white text-slate-900 hover:bg-slate-100">
              <Shirt className="h-4 w-4" /> {cfg.primaryButtonLabel}
            </Link>
          )}
          {cfg.secondaryButtonLabel && (
            <Link href={cfg.secondaryButtonLink || "/shop"} className="btn border border-white/40 bg-transparent text-white hover:bg-white/10">
              {cfg.secondaryButtonLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- USPs ----------
async function UspsSection() {
  const s = await getSettings();
  const usps = [
    [Truck, s.usp1Title, s.usp1Text],
    [Shirt, s.usp2Title, s.usp2Text],
    [ShieldCheck, s.usp3Title, s.usp3Text],
    [RotateCcw, s.usp4Title, s.usp4Text],
  ];
  return (
    <section className="border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="container-x grid grid-cols-2 gap-4 py-6 md:grid-cols-4">
        {usps.map(([Icon, title, sub]) => (
          <div key={title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              {sub && <p className="text-xs text-slate-500">{sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Flash sale ----------
async function FlashSaleSection({ section }) {
  const products = await getProductSet({ source: "flash-sale", limit: 8 });
  if (products.length === 0) return null;
  const flashEnd = products[0]?.flashSaleEndsAt;
  const cfg = section.config || {};
  return (
    <section className="container-x py-12">
      <div className="rounded-3xl bg-gradient-to-r from-red-600 to-amber-500 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {cfg.badge && <p className="text-xs font-bold uppercase tracking-widest">{cfg.badge}</p>}
            <h2 className="text-2xl font-black sm:text-3xl">{section.title || "Flash Sale"}</h2>
            {section.subtitle && <p className="mt-1 text-sm text-white/85">{section.subtitle}</p>}
          </div>
          {flashEnd && <CountdownTimer endAt={flashEnd} />}
          <Link href="/shop?sale=1" className="btn self-start bg-white text-red-600 hover:bg-red-50 sm:self-auto">
            Grab the deals <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="mt-6">
        <ProductGrid products={toPlain(products)} columns={4} />
      </div>
    </section>
  );
}

// ---------- Categories ----------
async function CategorySection({ section }) {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 8,
  });
  if (categories.length === 0) return null;
  return (
    <Shell>
      <SectionHeader title={section.title || "Shop by Category"} subtitle={section.subtitle} href="/shop" />
      <CategoryMenu categories={categories} />
    </Shell>
  );
}

// ---------- Feature banner ----------
async function FeatureBannerSection({ section }) {
  const s = await getSettings();
  const cfg = section.config || {};
  const banner = cfg.title
    ? { title: cfg.title, subtitle: cfg.subtitle || null, link: cfg.link || null, image: cfg.image || null }
    : await prisma.banner.findFirst({ where: { position: "home-section", isActive: true }, orderBy: { sortOrder: "asc" } });
  if (!banner) return null;
  const content = (
    <div className="flex flex-col items-center gap-6 p-8 md:flex-row md:justify-between">
      <div className="max-w-lg">
        <h3 className="text-2xl font-black sm:text-3xl">{banner.title}</h3>
        {banner.subtitle && <p className="mt-2 text-slate-500">{banner.subtitle}</p>}
        <span className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:underline">
          Shop now <ChevronRight className="h-4 w-4" />
        </span>
      </div>
      {banner.image ? (
        <Image src={banner.image} alt={banner.title} width={112} height={112} className="rounded-full object-cover" />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-600 text-5xl font-black text-white rotate-6 transition group-hover:rotate-12">%OFF</div>
      )}
    </div>
  );
  return (
    <section className="container-x">
      {banner.link ? (
        <Link href={banner.link} className="card group relative mt-4 block overflow-hidden">{content}</Link>
      ) : (
        <div className="card group relative mt-4 overflow-hidden">{content}</div>
      )}
    </section>
  );
}

// ---------- Product lists (new arrivals / best sellers / trending / recommended / product-grid) ----------
async function ProductListSection({ section, source, icon, tinted = false }) {
  const cfg = section.config || {};
  const sourceUs = source || cfg.source || "newest";
  const limit = cfg.limit || 8;
  const products = await getProductSet({ source: sourceUs, ref: cfg.ref || cfg.sourceSlug || null, limit });
  if (products.length === 0) return null;
  return (
    <Shell tinted={tinted} className={tinted ? "bg-slate-50 !rounded-none dark:bg-slate-900" : ""}>
      <SectionHeader
        title={section.title}
        subtitle={section.subtitle}
        href={cfg.viewAllLink || (sourceUs !== "product-grid" ? "/shop" : undefined)}
        icon={icon ? <span className="mr-0">{icon}</span> : null}
      />
      <ProductGrid products={toPlain(products)} columns={cfg.columns || 4} />
    </Shell>
  );
}

// ---------- Reviews ----------
async function ReviewsSection({ section }) {
  const reviews = await prisma.review.findMany({
    where: { status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { user: { select: { name: true, avatar: true } }, product: { select: { name: true, slug: true } } },
  });
  if (reviews.length === 0) return null;
  return (
    <Shell className="bg-slate-50 !rounded-none dark:bg-slate-900">
      <SectionHeader title={section.title || "What Customers Say"} subtitle={section.subtitle} />
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-5">
            <RatingStars rating={r.rating} size="h-4 w-4" />
            <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">“{r.body}”</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {r.user.name[0]}
              </span>
              <div>
                <p className="text-sm font-semibold">{r.user.name}</p>
                <p className="text-xs text-slate-400">on {r.product.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ---------- Newsletter ----------
function NewsletterSection({ section }) {
  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-14 text-white">
      <div className="container-x flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-black sm:text-3xl">{section.title || "Get 10% off your first order"}</h2>
        {section.subtitle && <p className="max-w-md text-slate-300">{section.subtitle}</p>}
        <NewsletterForm />
      </div>
    </section>
  );
}

// ---------- Custom banner ----------
function BannerSection({ section }) {
  const cfg = section.config || {};
  const title = section.title || cfg.title || "Promotion";
  const subtitle = section.subtitle || cfg.subtitle;
  const link = cfg.link;
  const image = cfg.image;
  const bg = cfg.backgroundColor || "";
  const content = (
    <div className="flex flex-col items-center gap-6 p-8 md:flex-row md:justify-between">
      <div className="max-w-lg">
        <h3 className="text-2xl font-black sm:text-3xl">{title}</h3>
        {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
        {link && (
          <span className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:underline">
            {cfg.buttonLabel || "Shop now"} <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
      {image ? (
        <Image src={image} alt={title} width={112} height={112} className="rounded-full object-cover" />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-600 text-5xl font-black text-white rotate-6 transition group-hover:rotate-12">%OFF</div>
      )}
    </div>
  );
  if (link) {
    return (
      <section className="container-x">
        <Link href={link} className="card group relative mt-4 block overflow-hidden" style={bg ? { backgroundColor: bg } : undefined}>{content}</Link>
      </section>
    );
  }
  return (
    <section className="container-x">
      <div className="card group relative mt-4 overflow-hidden" style={bg ? { backgroundColor: bg } : undefined}>{content}</div>
    </section>
  );
}

// ---------- Custom HTML ----------
function HtmlSection({ section }) {
  const cfg = section.config || {};
  if (!cfg.html) return null;
  return (
    <section className="container-x py-10">
      {section.title && <h2 className="mb-4 text-xl font-black sm:text-2xl">{section.title}</h2>}
      <div className="prose prose-slate mx-auto max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: cfg.html }} />
    </section>
  );
}