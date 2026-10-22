import type { Metadata } from "next";
import "./globals.css";
import { PageView } from "../components/public/page-view";

export const metadata: Metadata = {
  metadataBase: new URL("https://aniway.harshit.page"),
  title: "Anime Schedule & Watchlist | Aniway",
  description:
    "Plan your anime week with seasonal picks, Japanese broadcast times in your timezone, a personal watchlist, and optional Crunchyroll sync.",
  alternates: {
    canonical: "/",
  },
  applicationName: "aniway - Anime schedule & watchlist",
  keywords: [
    "anime schedule",
    "seasonal anime",
    "anime watchlist",
    "anime release calendar",
    "Crunchyroll watchlist",
  ],
  openGraph: {
    type: "website",
    siteName: "aniway",
    title: "Anime Schedule & Watchlist | Aniway",
    description:
      "Plan your anime week with seasonal picks, Japanese broadcast times in your timezone, a personal watchlist, and optional Crunchyroll sync.",
    images: [
      {
        url: "/anime-landscape.png",
        alt: "Anime-inspired landscape from aniway",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime Schedule & Watchlist | Aniway",
    description:
      "Plan your anime week with seasonal picks, Japanese broadcast times in your timezone, a personal watchlist, and optional Crunchyroll sync.",
    images: ["/anime-landscape.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Aniway",
  alternateName: "aniway",
  url: "https://aniway.harshit.page/",
  description: metadata.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <PageView />
        {children}
      </body>
    </html>
  );
}
