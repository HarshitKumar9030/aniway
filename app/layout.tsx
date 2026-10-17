import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "aniway — Your anime, on your time",
  description: "Your timezone-aware anime release schedule and personal watchlist.",
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
