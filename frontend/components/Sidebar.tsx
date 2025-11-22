"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Scale } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/disputes", label: "Disputes", icon: Scale },
  ];

  return (
    <aside className="w-20 bg-transparent border-r border-gray-700 min-h-screen p-4">
      <nav className="space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={24} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
