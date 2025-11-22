"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletBadge } from "@/components/WalletBadge";
import { BookOpenIcon, FileIcon, Table, Table2 } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/resources", label: "Resources", icon: <Table2 /> },
    { href: "/disputes", label: "My Disputes", icon: <FileIcon /> },
  ];

  return (
    <aside className="w-64 bg-white border-r shadow-sm sticky top-0 h-screen flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b flex-shrink-0">
        <Link
          href="/"
          className="text-gray-900 font-bold text-xl hover:text-gray-700 transition-colors"
        >
          okayokayokay
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Wallet Badge */}
      <div className="p-4 border-t flex-shrink-0">
        <WalletBadge />
      </div>
    </aside>
  );
}
