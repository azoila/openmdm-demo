"use client";

import { useState } from "react";
import {
  Smartphone,
  MoreHorizontal,
  RefreshCw,
  Power,
  Lock,
  Trash2,
  Shield,
  Ban,
  CheckCircle,
  Settings,
  Eye,
  Tv,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Device, DeviceStatus } from "@/lib/mdm-types";
import { TimeAgo } from "@/components/ui/time-ago";

interface DeviceTableProps {
  devices: Device[] | undefined;
  isLoading: boolean;
  selectedDevices: string[];
  onSelectionChange: (ids: string[]) => void;
  onViewDevice: (device: Device) => void;
  onSyncDevice: (id: string) => void;
  onRebootDevice: (id: string) => void;
  onLockDevice: (id: string) => void;
  onBlockDevice: (id: string) => void;
  onUnblockDevice: (id: string) => void;
  onWipeDevice: (id: string) => void;
  onEnableKiosk: (id: string) => void;
}

function getStatusBadge(status: DeviceStatus) {
  switch (status) {
    case "enrolled":
      return <Badge variant="default" className="bg-green-500">Enrolled</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">Pending</Badge>;
    case "blocked":
      return <Badge variant="destructive">Blocked</Badge>;
    case "unenrolled":
      return <Badge variant="outline">Unenrolled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function OnlineStatus({ lastHeartbeat }: { lastHeartbeat: string | null }) {
  if (!lastHeartbeat) {
    return <span className="text-muted-foreground">Never</span>;
  }

  const heartbeatDate = new Date(lastHeartbeat);
  // Use a fixed threshold calculation that works on both server and client
  const oneHourMs = 60 * 60 * 1000;
  const heartbeatTime = heartbeatDate.getTime();

  // Check if within last hour (approximate, will be slightly off during hydration but close enough)
  const isRecent = Date.now() - heartbeatTime < oneHourMs;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${isRecent ? "bg-green-500" : "bg-gray-400"}`}
        suppressHydrationWarning
      />
      <TimeAgo
        date={heartbeatDate}
        className={isRecent ? "text-green-600" : "text-muted-foreground"}
        fallback="Never"
      />
    </div>
  );
}

function getBatteryDisplay(level: number | null) {
  if (level === null) return <span className="text-muted-foreground">-</span>;

  const color = level > 50 ? "text-green-500" : level > 20 ? "text-yellow-500" : "text-red-500";

  return <span className={color}>{level}%</span>;
}

export function DeviceTable({
  devices,
  isLoading,
  selectedDevices,
  onSelectionChange,
  onViewDevice,
  onSyncDevice,
  onRebootDevice,
  onLockDevice,
  onBlockDevice,
  onUnblockDevice,
  onWipeDevice,
  onEnableKiosk,
}: DeviceTableProps) {
  const toggleSelectAll = () => {
    if (!devices) return;
    if (selectedDevices.length === devices.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(devices.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedDevices.includes(id)) {
      onSelectionChange(selectedDevices.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedDevices, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <Smartphone className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No devices found</h3>
        <p className="text-muted-foreground">
          Devices will appear here once they enroll with the MDM server.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedDevices.length === devices.length && devices.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Seen</TableHead>
            <TableHead>Battery</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id} className="cursor-pointer">
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedDevices.includes(device.id)}
                  onCheckedChange={() => toggleSelect(device.id)}
                  aria-label={`Select ${device.name || device.model || "device"}`}
                />
              </TableCell>
              <TableCell onClick={() => onViewDevice(device)}>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{device.name || device.model || "Unknown Device"}</div>
                    <div className="text-xs text-muted-foreground">
                      {device.serial || device.enrollmentId || device.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell onClick={() => onViewDevice(device)}>
                <div>
                  <div>{device.manufacturer || "-"}</div>
                  <div className="text-xs text-muted-foreground">
                    Android {device.osVersion || "-"}
                  </div>
                </div>
              </TableCell>
              <TableCell onClick={() => onViewDevice(device)}>
                {getStatusBadge(device.status)}
              </TableCell>
              <TableCell onClick={() => onViewDevice(device)}>
                <OnlineStatus lastHeartbeat={device.lastHeartbeat} />
              </TableCell>
              <TableCell onClick={() => onViewDevice(device)}>
                {getBatteryDisplay(device.batteryLevel)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewDevice(device)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onSyncDevice(device.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRebootDevice(device.id)}>
                      <Power className="mr-2 h-4 w-4" />
                      Reboot
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLockDevice(device.id)}>
                      <Lock className="mr-2 h-4 w-4" />
                      Lock
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEnableKiosk(device.id)}>
                      <Tv className="mr-2 h-4 w-4" />
                      Kiosk Mode
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {device.status === "blocked" ? (
                      <DropdownMenuItem onClick={() => onUnblockDevice(device.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Unblock
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onBlockDevice(device.id)}
                        className="text-orange-600"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Block
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onWipeDevice(device.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Wipe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
