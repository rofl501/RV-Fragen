import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Anonyme Fragen - Tutorium Q&A",
  description: "Stelle deinem Tutor anonyme Fragen",
  icons: {
    icon: [
      { url: '/RVlogo-lightmode.png', media: '(prefers-color-scheme: light)' },
      { url: '/RVlogo-darkmode.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: [
      { url: '/RVlogo-lightmode.png', media: '(prefers-color-scheme: light)' },
      { url: '/RVlogo-darkmode.png', media: '(prefers-color-scheme: dark)' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <DynamicFavicon />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
