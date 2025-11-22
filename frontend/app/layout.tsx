import type { Metadata } from "next";
import Link from "next/link";
import { Web3Provider } from "@/components/providers/Web3Provider";
import WalletConnect from "@/components/WalletConnect";
import "./globals.css";

export const metadata: Metadata = {
  title: "okayokayokay - Dispute Resolution Platform",
  description: "x402 payment dispute resolution with multi-layer arbitration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <nav className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <Link href="/" className="flex items-center px-2 text-gray-900 font-bold text-xl">
                    okayokayokay
                  </Link>
                  <div className="ml-6 flex space-x-4">
                    <Link
                      href="/resources"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      Resources
                    </Link>
                    <Link
                      href="/events"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      Events
                    </Link>
                  </div>
                </div>
                <div className="flex items-center">
                  <WalletConnect />
                </div>
              </div>
            </div>
          </nav>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
