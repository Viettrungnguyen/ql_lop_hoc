import type { Metadata } from "next";
import { Be_Vietnam_Pro, Manrope } from "next/font/google";

import "./globals.css";

const bodyFont = Be_Vietnam_Pro({
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-body",
  fallback: ["Arial", "sans-serif"],
});

const displayFont = Manrope({
  subsets: ["vietnamese"],
  display: "swap",
  variable: "--font-display",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Lớp Việt — Dạy học gọn gàng, tiến bộ rõ ràng",
    template: "%s | Lớp Việt",
  },
  description:
    "Nền tảng quản lý lớp học, bài giảng, bài tập và kết quả học tập dành cho giáo viên Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
