import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Putar SO",
  description: "Simulator interaktif penjadwalan Round Robin",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body><SiteNav />{children}</body>
    </html>
  );
}
