import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "关键词竞技场 | Keyword Arena",
  description: "输入关键词，AI 生成角色，回合制对战！像素风 RPG 竞技场，每个关键词都是一场冒险。",
  metadataBase: new URL("https://keyword-arena.vercel.app"),
  openGraph: {
    title: "⚔️ 关键词竞技场 | Keyword Arena",
    description: "🎲 输入关键词 → 🤖 AI生成角色 → ⚔️ 回合制对战！像素风 RPG 竞技场，来创造你的专属角色吧！",
    url: "https://keyword-arena.vercel.app",
    siteName: "Keyword Arena",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "关键词竞技场 | Keyword Arena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "⚔️ 关键词竞技场 | Keyword Arena",
    description: "🎲 输入关键词 → 🤖 AI生成角色 → ⚔️ 回合制对战！",
    images: ["/api/og"],
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚔️</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=ZCOOL+QingKe+HuangYou&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-950 text-white min-h-screen font-pixel-zh">
        {children}
      </body>
    </html>
  );
}
