import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dalfitra = localFont({
  src: "../public/fonts/Dalfitra-Regular - Follow IG @fontforzula/Dalfitra-Regular.otf",
  variable: "--font-dalfitra",
  weight: "400",
});

export const metadata: Metadata = {
  title: "OkayOkayOkay - Dispute Arbitration Platform for Agentic Commerce",
  description: "Dispute Arbitration Platform for Agentic Commerce",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "OkayOkayOkay - Dispute Arbitration Platform for Agentic Commerce",
    description: "Dispute Arbitration Platform for Agentic Commerce",
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
        className={`${geistSans.variable} ${geistMono.variable} ${dalfitra.variable} antialiased text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
