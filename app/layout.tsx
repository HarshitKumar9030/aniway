import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "aniway",
  description:
    "Browse seasonal anime, follow Japanese broadcast times in your timezone, and bring your aniway and Crunchyroll watchlists together.",
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
    title: "Anime schedule & watchlist | aniway",
    description:
      "Browse seasonal anime, follow Japanese broadcast times in your timezone, and bring your aniway and Crunchyroll watchlists together.",
    images: [
      {
        url: "/anime-landscape.png",
        alt: "Anime-inspired landscape from aniway",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime schedule & watchlist | aniway",
    description:
      "Browse seasonal anime, follow Japanese broadcast times in your timezone, and bring your aniway and Crunchyroll watchlists together.",
    images: ["/anime-landscape.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
