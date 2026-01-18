"use client";

import {
  Smartphone,
  Battery,
  HardDrive,
  MapPin,
  Clock,
  Shield,
  FolderTree,
  RefreshCw,
  Power,
  Lock,
  Ban,
  Trash2,
  Tv,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Device, Command, Policy, Group } from "@/lib/mdm-types";
import { formatBytes } from "@/lib/format";
import { TimeAgo, FormattedDateTime } from "@/components/ui/time-ago";
import { useDeviceDetails, useDeviceCommands, usePolicies, useGroups } from "@/lib/mdm-hooks";

interface DeviceDetailSheetProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: () => void;
  onReboot: () => void;
  onLock: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onWipe: () => void;
  onEnableKiosk: () => void;
  onDisableKiosk: () => void;
  onAssignPolicy: (policyId: string) => void;
  onAssignGroup: (groupId: string) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "enrolled":
      return <Badge className="bg-green-500">Enrolled</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">Pending</Badge>;
    case "blocked":
      return <Badge variant="destructive">Blocked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getCommandStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "pending":
    case "sent":
      return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export function DeviceDetailSheet({
  device,
  open,
  onOpenChange,
  onSync,
  onReboot,
  onLock,
  onBlock,
  onUnblock,
  onWipe,
  onEnableKiosk,
  onDisableKiosk,
  onAssignPolicy,
  onAssignGroup,
}: DeviceDetailSheetProps) {
  const { data: details } = useDeviceDetails(device?.id || "");
  const { data: commandsData } = useDeviceCommands(device?.id || "");
  const { data: policies } = usePolicies();
  const { data: groups } = useGroups();

  const deviceData = details || device;
  const commands = commandsData || [];

  if (!deviceData) return null;

  const isOnline =
    deviceData.lastHeartbeat &&
    new Date(deviceData.lastHeartbeat).getTime() > Date.now() - 60 * 60 * 1000;

  const storageUsed =
    deviceData.storageTotal && deviceData.storageFree
      ? deviceData.storageTotal - deviceData.storageFree
      : null;
  const storagePercentage =
    deviceData.storageTotal && storageUsed
      ? Math.round((storageUsed / deviceData.storageTotal) * 100)
      : null;

  const isKioskMode = deviceData.policy?.settings?.kioskMode === true;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <SheetTitle className="text-left">
                  {deviceData.name || deviceData.model || "Unknown Device"}
                </SheetTitle>
                <SheetDescription className="text-left">
                  {deviceData.serial || deviceData.id}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
                suppressHydrationWarning
              />
              {getStatusBadge(deviceData.status)}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="commands">Commands</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={onSync}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync
                    </Button>
                    <Button size="sm" variant="outline" onClick={onReboot}>
                      <Power className="mr-2 h-4 w-4" />
                      Reboot
                    </Button>
                    <Button size="sm" variant="outline" onClick={onLock}>
                      <Lock className="mr-2 h-4 w-4" />
                      Lock
                    </Button>
                    {isKioskMode ? (
                      <Button size="sm" variant="outline" onClick={onDisableKiosk}>
                        <X className="mr-2 h-4 w-4" />
                        Exit Kiosk
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={onEnableKiosk}>
                        <Tv className="mr-2 h-4 w-4" />
                        Kiosk Mode
                      </Button>
                    )}
                    {deviceData.status === "blocked" ? (
                      <Button size="sm" variant="outline" onClick={onUnblock}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Unblock
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={onBlock}>
                        <Ban className="mr-2 h-4 w-4" />
                        Block
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={onWipe}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Wipe
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Device Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Device Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Manufacturer</span>
                    <p className="font-medium">{deviceData.manufacturer || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model</span>
                    <p className="font-medium">{deviceData.model || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">OS Version</span>
                    <p className="font-medium">Android {deviceData.osVersion || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Serial</span>
                    <p className="font-medium font-mono text-xs">
                      {deviceData.serial || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IMEI</span>
                    <p className="font-medium font-mono text-xs">
                      {deviceData.imei || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">MAC Address</span>
                    <p className="font-medium font-mono text-xs">
                      {deviceData.macAddress || "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Battery className="h-4 w-4" />
                      <span className="text-xs">Battery</span>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        deviceData.batteryLevel
                          ? deviceData.batteryLevel > 50
                            ? "text-green-500"
                            : deviceData.batteryLevel > 20
                              ? "text-yellow-500"
                              : "text-red-500"
                          : ""
                      }`}
                    >
                      {deviceData.batteryLevel !== null
                        ? `${deviceData.batteryLevel}%`
                        : "-"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <HardDrive className="h-4 w-4" />
                      <span className="text-xs">Storage</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {storagePercentage !== null ? `${storagePercentage}%` : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(storageUsed)} / {formatBytes(deviceData.storageTotal)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Location */}
              {deviceData.latitude && deviceData.longitude && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs">Last Known Location</span>
                    </div>
                    <p className="font-mono text-sm">
                      {deviceData.latitude.toFixed(6)}, {deviceData.longitude.toFixed(6)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Policy & Groups */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-xs">Policy</span>
                    </div>
                    <Badge variant="outline">
                      {(deviceData as any).policy?.name || "Default Policy"}
                    </Badge>
                  </div>
                  {(deviceData as any).groups?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <FolderTree className="h-4 w-4" />
                        <span className="text-xs">Groups</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(deviceData as any).groups.map((g: Group) => (
                          <Badge key={g.id} variant="secondary">
                            {g.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Last Heartbeat */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Last Heartbeat</span>
                  </div>
                  <FormattedDateTime
                    date={deviceData.lastHeartbeat}
                    className="font-medium block"
                    fallback="Never"
                  />
                  {deviceData.lastHeartbeat && (
                    <TimeAgo
                      date={deviceData.lastHeartbeat}
                      className="text-xs text-muted-foreground"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commands" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Commands</CardTitle>
                </CardHeader>
                <CardContent>
                  {commands.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No commands sent to this device yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {commands.map((cmd: Command) => (
                        <div
                          key={cmd.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            {getCommandStatusIcon(cmd.status)}
                            <div>
                              <p className="font-medium text-sm">{cmd.type}</p>
                              <FormattedDateTime
                                date={cmd.createdAt}
                                className="text-xs text-muted-foreground"
                              />
                            </div>
                          </div>
                          <Badge
                            variant={
                              cmd.status === "completed"
                                ? "default"
                                : cmd.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {cmd.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              {/* Assign Policy */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Assign Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={(deviceData as any).policy?.id || ""}
                    onValueChange={(v) => typeof v === "string" && v && onAssignPolicy(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      {policies?.map((policy: Policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.name}
                          {policy.isDefault && " (Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Assign to Group */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FolderTree className="h-4 w-4" />
                    Add to Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={(v) => typeof v === "string" && v && onAssignGroup(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((group: Group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Installed Apps */}
              {deviceData.installedApps && deviceData.installedApps.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Installed Apps ({deviceData.installedApps.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {deviceData.installedApps.map((app, i) => (
                        <div
                          key={i}
                          className="text-xs font-mono bg-muted px-2 py-1 rounded"
                        >
                          {app}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
