import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "chirashi-box",
  description: "気になる展示のチラシを集めるアプリ",
  appleWebApp: { capable: true, title: "chirashi-box", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="mx-auto flex min-h-full w-full max-w-xl flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-background/95 px-4 py-3 backdrop-blur dark:border-neutral-800">
          <Link href="/" className="text-base font-bold tracking-wide">
            chirashi-box
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/">眺める</Link>
            <Link href="/me">マイページ</Link>
          </nav>
        </header>
        <main className="flex-1 px-4 py-4">{children}</main>
      </body>
    </html>
  );
}
