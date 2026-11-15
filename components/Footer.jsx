import Link from "next/link";
import Image from "next/image";
import { Shirt, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube, MessageSquare } from "lucide-react";

const SOCIALS = [
  ["socialInstagram", Instagram],
  ["socialTwitter", Twitter],
  ["socialFacebook", Facebook],
  ["socialYoutube", Youtube],
  ["socialTiktok", null],
  ["socialLinkedin", Linkedin],
  ["socialWhatsApp", MessageSquare],
];

export default function Footer({ settings = {} }) {
  const year = new Date().getFullYear();
  const store = settings.storeName || "Saayo";
  const payments = settings.paymentsBadge || "Stripe · Razorpay · COD";
  const copyright =
    settings.copyrightText || `© ${year} ${store}. All rights reserved.`;

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="mb-4 flex items-center gap-2 font-extrabold text-xl">
            {settings.logoUrl ? (
              <Image src={settings.logoUrl} alt={store} height={36} className="w-auto max-w-[140px] object-contain" />
            ) : (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Shirt className="h-5 w-5" /></span>
                <span className="text-slate-900 dark:text-white">{store}</span>
              </>
            )}
          </Link>
          {settings.tagline && (
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{settings.tagline}</p>
          )}
          {settings.footerAbout && (
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{settings.footerAbout}</p>
          )}
          <div className="flex gap-2">
            {SOCIALS.map(([key, Icon]) => {
              const url = settings[key];
              if (!url || !Icon) return null;
              return (
                <a key={key} href={url} target="_blank" rel="noreferrer" aria-label={key.replace("social", "")} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-brand-500 hover:text-brand-600 dark:border-slate-700">
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        <FooterCol title="Shop" links={[
          ["/shop", "All Tees"], ["/shop?sort=featured", "Featured"], ["/shop?sort=newest", "New Arrivals"],
          ["/shop?sale=1", "On Sale"], ["/category/graphic-tees", "Graphic Tees"], ["/category/oversized-tees", "Oversized Tees"],
        ]} />

        <FooterCol title="Company" links={[
          ["/about", "About Us"], ["/contact", "Contact"], ["/faq", "FAQ"], ["/blog", "Blog"],
          ["/privacy-policy", "Privacy Policy"], ["/terms", "Terms & Conditions"], ["/return-refund-policy", "Return & Refund Policy"],
        ]} />

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">Contact</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {settings.address && <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-brand-600" /> {settings.address}</li>}
            {settings.supportPhone && <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-brand-600" /> {settings.supportPhone}</li>}
            {settings.supportEmail && <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-brand-600" /> {settings.supportEmail}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        {copyright} Payment: {payments}
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">{title}</h3>
      <ul className="space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}