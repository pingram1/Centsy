import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Centsy",
    template: "%s · Centsy",
  },
  description:
    "Snap receipts from your phone. AI-powered personal and business finance tracking.",
  applicationName: "Centsy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Centsy",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/branding/centsy-icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/branding/centsy-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/branding/centsy-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/branding/centsy-icon-192.png", type: "image/png", sizes: "192x192" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4fbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1f24" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh overscroll-none font-sans touch-manipulation">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
