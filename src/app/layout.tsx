import type { Metadata } from "next";

import "./globals.css";

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
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
