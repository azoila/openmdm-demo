import Link from "next/link";
import { Smartphone } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh flex flex-col">
      {/* Simple Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Smartphone className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">OpenMDM</span>
        </Link>
        <ModeToggle />
      </header>

      {/* Centered Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="p-4 md:p-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} OpenMDM. All rights reserved.
      </footer>
    </div>
  );
}
