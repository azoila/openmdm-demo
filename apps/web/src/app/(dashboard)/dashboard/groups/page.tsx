"use client";

import { GroupManagement } from "@/components/mdm";

export default function GroupsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
        <p className="text-muted-foreground">
          Organize devices into groups for targeted management
        </p>
      </div>

      <GroupManagement />
    </div>
  );
}
