"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Smartphone,
  Shield,
  Package,
  FolderTree,
  Settings,
  LogOut,
  HelpCircle,
  Menu,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import type { Route } from "next";

const navigationItems = [
  {
    title: "Overview",
    href: "/dashboard" as Route,
    icon: LayoutDashboard,
  },
  {
    title: "Devices",
    href: "/dashboard/devices" as Route,
    icon: Smartphone,
  },
  {
    title: "Enrollment",
    href: "/dashboard/enrollment" as Route,
    icon: QrCode,
  },
  {
    title: "Apps",
    href: "/dashboard/apps" as Route,
    icon: Package,
  },
  {
    title: "Groups",
    href: "/dashboard/groups" as Route,
    icon: FolderTree,
  },
  {
    title: "Policies",
    href: "/dashboard/policies" as Route,
    icon: Shield,
  },
];

const secondaryItems = [
  {
    title: "Settings",
    href: "/dashboard/settings" as Route,
    icon: Settings,
  },
  {
    title: "Help",
    href: "/dashboard/help" as Route,
    icon: HelpCircle,
  },
];

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="lg:hidden" />}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
        {/* Logo */}
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-foreground">OpenMDM</SheetTitle>
              <span className="text-xs text-muted-foreground">
                Device Management
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          <nav className="flex flex-col gap-1">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="border-t p-3 mt-auto">
          {isPending ? (
            <div className="flex items-center gap-3 rounded-xl p-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ) : session ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl p-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {getInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={() => {
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push("/");
                        setOpen(false);
                      },
                    },
                  });
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/login" onClick={handleNavClick}>
              <Button className="w-full rounded-xl">Sign In</Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
