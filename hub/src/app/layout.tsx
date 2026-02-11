import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ArcadeForge Hub",
  description:
    "Discover and play browser games built by the community with ArcadeForge, the AI-powered game creation toolkit.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "ArcadeForge Hub",
    description:
      "Discover and play browser games built by the community with ArcadeForge.",
    siteName: "ArcadeForge Hub",
    type: "website",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen flex flex-col`}>
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon/15 border border-neon/30 transition-all group-hover:shadow-neon group-hover:bg-neon/25">
                <span className="text-lg font-bold text-neon">A</span>
              </div>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-neon">Arcade</span>
                <span className="text-white">Forge</span>
              </span>
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-neon"
              >
                Home
              </Link>
              <Link
                href="/submit"
                className="btn-primary text-sm"
              >
                Submit Game
              </Link>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-gray-500">
                Built with{" "}
                <span className="font-semibold text-neon">ArcadeForge</span>
              </p>
              <div className="flex gap-6">
                <Link
                  href="/admin"
                  className="text-xs text-gray-600 transition-colors hover:text-gray-400"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
