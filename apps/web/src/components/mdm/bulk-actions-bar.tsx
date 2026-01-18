"use client";

import { X, RefreshCw, Power, Lock, Shield, Send, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Policy } from "@/lib/mdm-types";

interface BulkActionsBarProps {
  selectedCount: number;
  policies: Policy[] | undefined;
  onClear: () => void;
  onSync: () => void;
  onReboot: () => void;
  onLock: () => void;
  onBlock: () => void;
  onApplyPolicy: (policyId: string) => void;
}

export function BulkActionsBar({
  selectedCount,
  policies,
  onClear,
  onSync,
  onReboot,
  onLock,
  onBlock,
  onApplyPolicy,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-2">
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium px-2 border-r">
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-2 px-2">
          <Button variant="outline" size="sm" onClick={onSync}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
          <Button variant="outline" size="sm" onClick={onReboot}>
            <Power className="mr-2 h-4 w-4" />
            Reboot
          </Button>
          <Button variant="outline" size="sm" onClick={onLock}>
            <Lock className="mr-2 h-4 w-4" />
            Lock
          </Button>
          <Button variant="outline" size="sm" onClick={onBlock}>
            <Ban className="mr-2 h-4 w-4" />
            Block
          </Button>
          <Select onValueChange={(v) => typeof v === "string" && v && onApplyPolicy(v)}>
            <SelectTrigger className="w-[180px] h-8">
              <Shield className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Apply Policy" />
            </SelectTrigger>
            <SelectContent>
              {policies?.map((policy) => (
                <SelectItem key={policy.id} value={policy.id}>
                  {policy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
