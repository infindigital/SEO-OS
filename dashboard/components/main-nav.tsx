"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  STAFF_ROLES,
  USER_ROLES,
  type UserRole,
} from "@backend/domain/auth/user-role";

interface NavItem {
  href: string;
  label: string;
  roles: readonly UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: USER_ROLES },
  { href: "/internal", label: "Internal", roles: STAFF_ROLES },
  { href: "/agency", label: "Agency", roles: STAFF_ROLES },
  { href: "/clients", label: "Clients", roles: STAFF_ROLES },
  { href: "/admin", label: "Admin", roles: ["ADMIN"] },
];

export function MainNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex items-center gap-6 text-sm">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "hover:text-foreground transition-colors",
              active ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
