import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ocean Ball Tasks - 创新的物理交互式任务管理工具",
  description: "基于物理引擎的可视化任务管理系统，让任务管理更有趣。通过拖拽海洋球来管理你的任务，支持里程碑追踪、进度管理和任务归档。",
  keywords: "任务管理,task management,物理引擎,可视化,项目管理,待办事项,todo list",
  authors: [{ name: "Ocean Ball Tasks" }],
  openGraph: {
    title: "Ocean Ball Tasks - 创新的物理交互式任务管理工具",
    description: "基于物理引擎的可视化任务管理系统，让任务管理更有趣",
    type: "website",
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
