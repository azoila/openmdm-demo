"use client";

import { useState } from "react";
import { RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsCards, CommandStats } from "./stats-cards";
import { DeviceTable } from "./device-table";
import { DeviceDetailSheet } from "./device-detail-sheet";
import { RecentEvents } from "./recent-events";
import { BulkActionsBar } from "./bulk-actions-bar";
import { ConfirmDialog } from "./confirm-dialog";
import { KioskDialog } from "./kiosk-dialog";
import {
  useDashboardStats,
  useDevices,
  useRecentEvents,
  usePolicies,
  useSyncDevice,
  useRebootDevice,
  useLockDevice,
  useWipeDevice,
  useBlockDevice,
  useUnblockDevice,
  useEnableKiosk,
  useDisableKiosk,
  useAssignDevicePolicy,
  useAssignDeviceToGroup,
  useBulkCommand,
  useBulkApplyPolicy,
} from "@/lib/mdm-hooks";
import type { Device } from "@/lib/mdm-types";
import { useQueryClient } from "@tanstack/react-query";
import { mdmKeys } from "@/lib/mdm-hooks";

export function MDMDashboard() {
  const queryClient = useQueryClient();

  // State
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [viewingDevice, setViewingDevice] = useState<Device | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [wipeDialogOpen, setWipeDialogOpen] = useState(false);
  const [kioskDialogOpen, setKioskDialogOpen] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: devicesData, isLoading: devicesLoading } = useDevices(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: eventsData, isLoading: eventsLoading } = useRecentEvents(20);
  const { data: policies } = usePolicies();

  // Mutations
  const syncDevice = useSyncDevice();
  const rebootDevice = useRebootDevice();
  const lockDevice = useLockDevice();
  const wipeDevice = useWipeDevice();
  const blockDevice = useBlockDevice();
  const unblockDevice = useUnblockDevice();
  const enableKiosk = useEnableKiosk();
  const disableKiosk = useDisableKiosk();
  const assignPolicy = useAssignDevicePolicy();
  const assignGroup = useAssignDeviceToGroup();
  const bulkCommand = useBulkCommand();
  const bulkApplyPolicy = useBulkApplyPolicy();

  const devices = devicesData || [];
  const events = eventsData?.events || [];

  // Handlers
  const handleViewDevice = (device: Device) => {
    setViewingDevice(device);
    setDetailSheetOpen(true);
  };

  const handleSync = (id: string) => syncDevice.mutate(id);
  const handleReboot = (id: string) => rebootDevice.mutate(id);
  const handleLock = (id: string) => lockDevice.mutate({ id });

  const handleBlock = (id: string) => {
    setTargetDeviceId(id);
    setBlockDialogOpen(true);
  };

  const handleConfirmBlock = () => {
    if (targetDeviceId) {
      blockDevice.mutate({ id: targetDeviceId, reason: "Blocked by admin" });
    }
  };

  const handleUnblock = (id: string) => unblockDevice.mutate(id);

  const handleWipe = (id: string) => {
    setTargetDeviceId(id);
    setWipeDialogOpen(true);
  };

  const handleConfirmWipe = () => {
    if (targetDeviceId) {
      wipeDevice.mutate({ id: targetDeviceId });
    }
  };

  const handleEnableKiosk = (id: string) => {
    setTargetDeviceId(id);
    setKioskDialogOpen(true);
  };

  const handleConfirmKiosk = (mainApp: string, allowedApps: string[]) => {
    if (targetDeviceId) {
      enableKiosk.mutate({ deviceId: targetDeviceId, mainApp, allowedApps });
      setKioskDialogOpen(false);
    }
  };

  const handleDisableKiosk = () => {
    if (viewingDevice) {
      disableKiosk.mutate(viewingDevice.id);
    }
  };

  const handleAssignPolicy = (policyId: string) => {
    if (viewingDevice) {
      assignPolicy.mutate({ id: viewingDevice.id, policyId });
    }
  };

  const handleAssignGroup = (groupId: string) => {
    if (viewingDevice) {
      assignGroup.mutate({ id: viewingDevice.id, groupId });
    }
  };

  // Bulk handlers
  const handleBulkSync = () => {
    bulkCommand.mutate({ deviceIds: selectedDevices, commandType: "sync" });
    setSelectedDevices([]);
  };

  const handleBulkReboot = () => {
    bulkCommand.mutate({ deviceIds: selectedDevices, commandType: "reboot" });
    setSelectedDevices([]);
  };

  const handleBulkLock = () => {
    bulkCommand.mutate({ deviceIds: selectedDevices, commandType: "lock" });
    setSelectedDevices([]);
  };

  const handleBulkBlock = () => {
    selectedDevices.forEach((id) => {
      blockDevice.mutate({ id, reason: "Bulk blocked by admin" });
    });
    setSelectedDevices([]);
  };

  const handleBulkApplyPolicy = (policyId: string) => {
    bulkApplyPolicy.mutate({ deviceIds: selectedDevices, policyId });
    setSelectedDevices([]);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: mdmKeys.all });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MDM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your enrolled devices
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Main Content */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {devices.length} device{devices.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Device Table */}
          <DeviceTable
            devices={devices}
            isLoading={devicesLoading}
            selectedDevices={selectedDevices}
            onSelectionChange={setSelectedDevices}
            onViewDevice={handleViewDevice}
            onSyncDevice={handleSync}
            onRebootDevice={handleReboot}
            onLockDevice={handleLock}
            onBlockDevice={handleBlock}
            onUnblockDevice={handleUnblock}
            onWipeDevice={handleWipe}
            onEnableKiosk={handleEnableKiosk}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CommandStats stats={stats} isLoading={statsLoading} />
            <RecentEvents events={events} isLoading={eventsLoading} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Device Detail Sheet */}
      <DeviceDetailSheet
        device={viewingDevice}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onSync={() => viewingDevice && handleSync(viewingDevice.id)}
        onReboot={() => viewingDevice && handleReboot(viewingDevice.id)}
        onLock={() => viewingDevice && handleLock(viewingDevice.id)}
        onBlock={() => viewingDevice && handleBlock(viewingDevice.id)}
        onUnblock={() => viewingDevice && handleUnblock(viewingDevice.id)}
        onWipe={() => viewingDevice && handleWipe(viewingDevice.id)}
        onEnableKiosk={() => viewingDevice && handleEnableKiosk(viewingDevice.id)}
        onDisableKiosk={handleDisableKiosk}
        onAssignPolicy={handleAssignPolicy}
        onAssignGroup={handleAssignGroup}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedDevices.length}
        policies={policies}
        onClear={() => setSelectedDevices([])}
        onSync={handleBulkSync}
        onReboot={handleBulkReboot}
        onLock={handleBulkLock}
        onBlock={handleBulkBlock}
        onApplyPolicy={handleBulkApplyPolicy}
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        title="Block Device"
        description="Are you sure you want to block this device? The device will no longer be able to sync or receive commands."
        confirmLabel="Block Device"
        variant="destructive"
        onConfirm={handleConfirmBlock}
      />

      <ConfirmDialog
        open={wipeDialogOpen}
        onOpenChange={setWipeDialogOpen}
        title="Wipe Device"
        description="Are you sure you want to wipe this device? This action is irreversible and will erase all data on the device."
        confirmLabel="Wipe Device"
        variant="destructive"
        onConfirm={handleConfirmWipe}
      />

      <KioskDialog
        open={kioskDialogOpen}
        onOpenChange={setKioskDialogOpen}
        onConfirm={handleConfirmKiosk}
        isLoading={enableKiosk.isPending}
      />
    </div>
  );
}
