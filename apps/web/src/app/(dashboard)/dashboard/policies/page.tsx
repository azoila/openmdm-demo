"use client";

import { PolicyManagement } from "@/components/mdm";

export default function PoliciesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Policies</h1>
        <p className="text-muted-foreground">
          Configure and enforce security policies across your fleet
        </p>
      </div>

      <PolicyManagement />
    </div>
  );
}
