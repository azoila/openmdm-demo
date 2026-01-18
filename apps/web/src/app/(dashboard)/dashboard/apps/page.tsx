"use client";

import { AppManagement } from "@/components/mdm";

export default function AppsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Manage and deploy applications to your devices
        </p>
      </div>

      <AppManagement />
    </div>
  );
}
