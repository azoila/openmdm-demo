"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import {
  LayoutDashboard,
  Smartphone,
  Shield,
  Package,
  FolderTree,
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  const mainLinks = [
    { to: "/", label: "Home" },
  ] as const;

  const dashboardLinks = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/policies", label: "Policies", icon: Shield },
    { to: "/dashboard/apps", label: "Apps", icon: Package },
    { to: "/dashboard/groups", label: "Groups", icon: FolderTree },
  ] as const;

  const isInDashboard = pathname?.startsWith("/dashboard");

  return (
    <div className="border-b">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Smartphone className="h-5 w-5" />
            <span>OpenMDM</span>
          </Link>

          <nav className="flex items-center gap-1">
            {mainLinks.map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted",
                  pathname === to ? "bg-muted" : "text-muted-foreground"
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted",
                isInDashboard ? "bg-muted" : "text-muted-foreground"
              )}
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Dashboard Sub-navigation */}
      {isInDashboard && (
        <div className="flex items-center gap-1 px-4 pb-2">
          {dashboardLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              href={to}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-muted",
                pathname === to
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
