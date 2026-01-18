"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useApplications } from "@/lib/mdm-hooks";

interface KioskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mainApp: string, allowedApps: string[]) => void;
  isLoading?: boolean;
}

export function KioskDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: KioskDialogProps) {
  const { data: apps } = useApplications();
  const [mainApp, setMainApp] = useState("");
  const [allowedApps, setAllowedApps] = useState<string[]>([]);

  const handleConfirm = () => {
    if (!mainApp) return;
    onConfirm(mainApp, [...allowedApps, mainApp, "com.openmdm.agent"]);
    setMainApp("");
    setAllowedApps([]);
  };

  const toggleAllowedApp = (packageName: string) => {
    if (allowedApps.includes(packageName)) {
      setAllowedApps(allowedApps.filter((a) => a !== packageName));
    } else {
      setAllowedApps([...allowedApps, packageName]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Kiosk Mode</DialogTitle>
          <DialogDescription>
            Configure kiosk mode to lock the device to specific applications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Main Application</Label>
            <Select value={mainApp} onValueChange={(v) => setMainApp(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select the main app" />
              </SelectTrigger>
              <SelectContent>
                {apps?.map((app) => (
                  <SelectItem key={app.id} value={app.packageName}>
                    {app.name} ({app.packageName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This app will launch automatically in kiosk mode.
            </p>
          </div>

          {apps && apps.length > 0 && (
            <div className="space-y-2">
              <Label>Additional Allowed Apps</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                {apps
                  .filter((app) => app.packageName !== mainApp)
                  .map((app) => (
                    <div key={app.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={app.id}
                        checked={allowedApps.includes(app.packageName)}
                        onCheckedChange={() => toggleAllowedApp(app.packageName)}
                      />
                      <label
                        htmlFor={app.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {app.name}
                      </label>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground">
                The MDM agent is always allowed in kiosk mode.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!mainApp || isLoading}>
            {isLoading ? "Enabling..." : "Enable Kiosk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
