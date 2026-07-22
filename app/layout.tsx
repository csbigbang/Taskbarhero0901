import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BackToTop } from "@/components/BackToTop";
import { Sidebar } from "@/components/Sidebar";
import { SiteHeader } from "@/components/SiteHeader";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./tbh-polish.css";
import "./tbh-user-images.css";
import "./tbh-core-pages.css";
import "./tbh-scale-70.css";
import "./tbh-typography.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TBH Database";




export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#050914",
};

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: "TBH Database: fan site brasileiro não oficial com itens, drops, fases e raridades de Task Bar Hero.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="wallpaper-layer" aria-hidden="true" />
        <div className="scanlines" aria-hidden="true" />
        <SiteHeader siteName={siteName} />
        <div className="app-shell">
          <Suspense fallback={<aside className="sidebar tbhdb-sidebar" aria-hidden="true" />}>
            <Sidebar />
          </Suspense>
          <div className="app-content">
            {children}
            <footer className="footer">
              <div>
                <strong>{siteName}</strong>
                <p>Fan site não oficial, feito por fãs. Sem afiliação com os desenvolvedores de TBH: Task Bar Hero.</p>
              </div>
              <div className="footer-links">
                <Link href="/items">Itens</Link>
                <Link href="/drops">Drops</Link>
                <Link href="/stages">Fases</Link>
                <Link href="/grades">Raridades</Link>
              </div>
            </footer>
          </div>
        </div>
        <BackToTop />
        <Analytics />
      </body>
    </html>
  );
}
