import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "サブスク管理",
  description: "サブスクリプションサービスを一元管理するアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
