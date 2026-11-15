import {
  Inter, Roboto, Open_Sans, Lato, Nunito, Poppins,
  Montserrat, Raleway, Merriweather, Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { toPlain } from "@/lib/utils";
import { getStoreSettings } from "@/lib/storeSettings";
import { brandThemeCss } from "@/lib/theme";
import StoreProvider from "@/components/StoreProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { prisma } from "@/lib/db";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-merriweather", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

const pageFonts = [inter, roboto, openSans, lato, nunito, poppins, montserrat, raleway, merriweather, playfair];

export async function generateMetadata() {
  const settings = await getStoreSettings();
  const name = settings.storeName || "Saayo",
    title = settings.seoTitle || `${name} — Custom 3D T-Shirt Store`;
  return {
    title: { default: title, template: `%s | ${name}` },
    description: settings.seoDescription,
    applicationName: name,
    metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
    openGraph: {
      type: "website",
      siteName: name,
      title,
      description: settings.seoDescription,
    },
    ...(settings.faviconUrl ? { icons: { icon: settings.faviconUrl } } : {}),
  };
}

export default async function RootLayout({ children }) {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
    getStoreSettings(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandThemeCss(settings.primaryColor) }} />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${inter.className} ${pageFonts.map((f) => f.variable).join(" ")} flex min-h-screen flex-col`}>
        <StoreProvider>
          <Header categories={toPlain(categories)} settings={toPlain(settings)} />
          <main className="flex-1">{children}</main>
          <Footer settings={toPlain(settings)} />
          <WhatsAppButton settings={toPlain(settings)} />
        </StoreProvider>
      </body>
    </html>
  );
}

export const revalidate = 300;