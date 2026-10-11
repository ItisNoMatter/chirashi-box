import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { InstallHint } from "@/components/InstallHint";
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
            <Link href="/register">登録</Link>
            <Link href="/me">マイページ</Link>
          </nav>
        </header>
        <InstallHint />
        <main className="flex-1 px-4 py-4">{children}</main>
        <footer className="border-t border-neutral-200 px-4 py-4 text-xs leading-relaxed text-neutral-500 dark:border-neutral-800">
          {/* 掲載についての窓口（0028）。サイトの持ち主が、リンクや画像を外してほしいと伝えられるように。 */}
          掲載について：展示の情報やリンク、画像の掲載を控えてほしい場合は、
          <a href="mailto:chirashi.box.app@gmail.com" className="underline">
            chirashi.box.app@gmail.com
          </a>
          までご連絡ください。
        </footer>
      </body>
    </html>
  );
}
