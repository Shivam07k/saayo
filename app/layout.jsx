import { Inter } from "next/font/google";
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

const pageFonts = [inter];

export async function generateMetadata() {
  try {
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
  } catch {
    return {
      title: "Saayo Tees — Custom 3D T-Shirt Store",
      description: "Create your custom 3D printed t-shirts",
    };
  }
}

export default async function RootLayout({ children }) {
  let categories = [];
  let settings = null;
  
  try {
    [categories, settings] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        take: 8,
      }),
      getStoreSettings(),
    ]);
  } catch {
    // Build-time fallback when DATABASE_URL not available
    settings = { storeName: "Saayo", primaryColor: "#2563eb" };
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandThemeCss(settings?.primaryColor) }} />
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