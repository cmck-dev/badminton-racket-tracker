import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";
import { getPlayerProfile } from "@/lib/actions";
import type { CurrencyCode } from "@/lib/currency";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShuttleTrack - Badminton Equipment Manager",
  description: "Track your badminton rackets, stringing, sessions and performance",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShuttleTrack",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let defaultCurrency: CurrencyCode = "USD";
  try {
    const profile = await getPlayerProfile();
    if (profile.currency) defaultCurrency = profile.currency as CurrencyCode;
  } catch {
    // not signed in yet — default to USD
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers defaultCurrency={defaultCurrency}>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0">
              <div className="container mx-auto px-4 py-6 md:px-8 md:py-8 pt-16 md:pt-8">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
