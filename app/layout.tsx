import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ocean Ball Tasks - Innovative Physics-Based Task Management",
  description: "A visual task management system powered by physics engine. Manage your tasks by dragging ocean balls. Features milestone tracking, progress management, and task archiving.",
  keywords: "task management,physics engine,visual,project management,todo list,productivity,interactive tasks",
  authors: [{ name: "Ocean Ball Tasks" }],
  openGraph: {
    title: "Ocean Ball Tasks - Innovative Physics-Based Task Management",
    description: "Visual task management system with physics engine - Make task management fun",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
