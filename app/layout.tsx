import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Press_Start_2P } from "next/font/google";
import { BackToTop } from "@/components/BackToTop";
import { Sidebar } from "@/components/Sidebar";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TBH Banco de Dados BR";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: "Banco de dados brasileiro de itens, drops, fases e raridades de TBH: Task Bar Hero. Projeto de fãs, não oficial.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={pixelFont.variable}>
        <div className="wallpaper-layer" aria-hidden="true" />
        <div className="scanlines" aria-hidden="true" />
        <SiteHeader siteName={siteName} />
        <div className="app-shell">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          <div className="app-content">
            {children}
            <footer className="footer">
              <div>
                <strong>{siteName}</strong>
                <p>Projeto de fãs, não oficial. Sem afiliação com os desenvolvedores de TBH: Task Bar Hero.</p>
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
      </body>
    </html>
  );
}
