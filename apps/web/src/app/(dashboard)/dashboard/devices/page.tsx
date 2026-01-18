"use client";

import { MDMDashboard } from "@/components/mdm";

export default function DevicesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
        <p className="text-muted-foreground">
          Manage and monitor all enrolled devices
        </p>
      </div>

      <MDMDashboard />
    </div>
  );
}
