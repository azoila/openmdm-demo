/**
 * MDM React Query Hooks
 * Custom hooks for fetching and mutating MDM data
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mdmApi } from "./mdm-api";
import type { Device, Policy, Application, Group } from "./mdm-types";
import { toast } from "sonner";

// Query keys
export const mdmKeys = {
  all: ["mdm"] as const,
  dashboard: () => [...mdmKeys.all, "dashboard"] as const,
  dashboardStats: () => [...mdmKeys.dashboard(), "stats"] as const,
  dashboardBreakdown: () => [...mdmKeys.dashboard(), "breakdown"] as const,
  dashboardEvents: (limit?: number) => [...mdmKeys.dashboard(), "events", limit] as const,
  devices: () => [...mdmKeys.all, "devices"] as const,
  deviceList: (filters?: Record<string, unknown>) => [...mdmKeys.devices(), "list", filters] as const,
  deviceDetail: (id: string) => [...mdmKeys.devices(), "detail", id] as const,
  deviceCommands: (id: string) => [...mdmKeys.devices(), "commands", id] as const,
  policies: () => [...mdmKeys.all, "policies"] as const,
  policyList: () => [...mdmKeys.policies(), "list"] as const,
  policyDetail: (id: string) => [...mdmKeys.policies(), "detail", id] as const,
  policyDevices: (id: string) => [...mdmKeys.policies(), "devices", id] as const,
  apps: () => [...mdmKeys.all, "apps"] as const,
  appList: () => [...mdmKeys.apps(), "list"] as const,
  appDetail: (id: string) => [...mdmKeys.apps(), "detail", id] as const,
  groups: () => [...mdmKeys.all, "groups"] as const,
  groupList: () => [...mdmKeys.groups(), "list"] as const,
  groupDetail: (id: string) => [...mdmKeys.groups(), "detail", id] as const,
  groupDevices: (id: string) => [...mdmKeys.groups(), "devices", id] as const,
  commands: () => [...mdmKeys.all, "commands"] as const,
  commandList: (filters?: Record<string, unknown>) => [...mdmKeys.commands(), "list", filters] as const,
  commandPending: (deviceId?: string) => [...mdmKeys.commands(), "pending", deviceId] as const,
};

// ============================================
// Dashboard Hooks
// ============================================

export function useDashboardStats() {
  return useQuery({
    queryKey: mdmKeys.dashboardStats(),
    queryFn: mdmApi.dashboard.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useDeviceBreakdown() {
  return useQuery({
    queryKey: mdmKeys.dashboardBreakdown(),
    queryFn: mdmApi.dashboard.getDeviceBreakdown,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useRecentEvents(limit = 50) {
  return useQuery({
    queryKey: mdmKeys.dashboardEvents(limit),
    queryFn: () => mdmApi.dashboard.getRecentEvents(limit),
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

// ============================================
// Device Hooks
// ============================================

export function useDevices(options?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: mdmKeys.deviceList(options),
    queryFn: () => mdmApi.devices.list(options),
    refetchInterval: 30000,
  });
}

export function useDeviceDetails(id: string) {
  return useQuery({
    queryKey: mdmKeys.deviceDetail(id),
    queryFn: () => mdmApi.devices.getDetails(id),
    enabled: !!id,
  });
}

export function useDeviceCommands(id: string, limit = 20) {
  return useQuery({
    queryKey: mdmKeys.deviceCommands(id),
    queryFn: () => mdmApi.devices.getCommandHistory(id, limit),
    enabled: !!id,
    refetchInterval: 10000,
  });
}

export function useBlockDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, wipe }: { id: string; reason: string; wipe?: boolean }) =>
      mdmApi.devices.block(id, reason, wipe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.devices() });
      queryClient.invalidateQueries({ queryKey: mdmKeys.dashboardStats() });
      toast.success("Device blocked successfully");
    },
    onError: (error) => {
      toast.error(`Failed to block device: ${error.message}`);
    },
  });
}

export function useUnblockDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mdmApi.devices.unblock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.devices() });
      queryClient.invalidateQueries({ queryKey: mdmKeys.dashboardStats() });
      toast.success("Device unblocked successfully");
    },
    onError: (error) => {
      toast.error(`Failed to unblock device: ${error.message}`);
    },
  });
}

export function useSyncDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mdmApi.devices.sync(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceCommands(id) });
      toast.success("Sync command sent");
    },
    onError: (error) => {
      toast.error(`Failed to sync device: ${error.message}`);
    },
  });
}

export function useRebootDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mdmApi.devices.reboot(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceCommands(id) });
      toast.success("Reboot command sent");
    },
    onError: (error) => {
      toast.error(`Failed to reboot device: ${error.message}`);
    },
  });
}

export function useLockDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      mdmApi.devices.lock(id, message),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceCommands(id) });
      toast.success("Lock command sent");
    },
    onError: (error) => {
      toast.error(`Failed to lock device: ${error.message}`);
    },
  });
}

export function useWipeDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, preserveSdCard }: { id: string; preserveSdCard?: boolean }) =>
      mdmApi.devices.wipe(id, preserveSdCard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.devices() });
      toast.success("Wipe command sent");
    },
    onError: (error) => {
      toast.error(`Failed to wipe device: ${error.message}`);
    },
  });
}

export function useAssignDeviceToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, groupId, applyPolicy }: { id: string; groupId: string; applyPolicy?: boolean }) =>
      mdmApi.devices.assignGroup(id, groupId, applyPolicy),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceDetail(id) });
      queryClient.invalidateQueries({ queryKey: mdmKeys.groupDevices(id) });
      toast.success("Device assigned to group");
    },
    onError: (error) => {
      toast.error(`Failed to assign device: ${error.message}`);
    },
  });
}

export function useAssignDevicePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, policyId }: { id: string; policyId: string }) =>
      mdmApi.devices.assignPolicy(id, policyId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceDetail(id) });
      toast.success("Policy assigned to device");
    },
    onError: (error) => {
      toast.error(`Failed to assign policy: ${error.message}`);
    },
  });
}

// ============================================
// Kiosk Hooks
// ============================================

export function useEnableKiosk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, mainApp, allowedApps }: { deviceId: string; mainApp: string; allowedApps?: string[] }) =>
      mdmApi.kiosk.enable(deviceId, mainApp, allowedApps),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceDetail(deviceId) });
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceCommands(deviceId) });
      toast.success("Kiosk mode enabled");
    },
    onError: (error) => {
      toast.error(`Failed to enable kiosk mode: ${error.message}`);
    },
  });
}

export function useDisableKiosk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => mdmApi.kiosk.disable(deviceId),
    onSuccess: (_, deviceId) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceDetail(deviceId) });
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceCommands(deviceId) });
      toast.success("Kiosk mode disabled");
    },
    onError: (error) => {
      toast.error(`Failed to disable kiosk mode: ${error.message}`);
    },
  });
}

// ============================================
// Policy Hooks
// ============================================

export function usePolicies() {
  return useQuery({
    queryKey: mdmKeys.policyList(),
    queryFn: mdmApi.policies.list,
  });
}

export function usePolicyDetails(id: string) {
  return useQuery({
    queryKey: mdmKeys.policyDetail(id),
    queryFn: () => mdmApi.policies.get(id),
    enabled: !!id,
  });
}

export function usePolicyDevices(id: string) {
  return useQuery({
    queryKey: mdmKeys.policyDevices(id),
    queryFn: () => mdmApi.policies.getDevices(id),
    enabled: !!id,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Policy, "id" | "createdAt" | "updatedAt">) =>
      mdmApi.policies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.policyList() });
      toast.success("Policy created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create policy: ${error.message}`);
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Policy> }) =>
      mdmApi.policies.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.policyList() });
      queryClient.invalidateQueries({ queryKey: mdmKeys.policyDetail(id) });
      toast.success("Policy updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update policy: ${error.message}`);
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mdmApi.policies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.policyList() });
      toast.success("Policy deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete policy: ${error.message}`);
    },
  });
}

// ============================================
// Application Hooks
// ============================================

export function useApplications() {
  return useQuery({
    queryKey: mdmKeys.appList(),
    queryFn: mdmApi.apps.list,
  });
}

export function useApplicationDetails(id: string) {
  return useQuery({
    queryKey: mdmKeys.appDetail(id),
    queryFn: () => mdmApi.apps.get(id),
    enabled: !!id,
  });
}

export function useRegisterApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Application, "id" | "createdAt" | "updatedAt" | "isActive">) =>
      mdmApi.apps.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.appList() });
      toast.success("Application registered successfully");
    },
    onError: (error) => {
      toast.error(`Failed to register application: ${error.message}`);
    },
  });
}

export function useDeployAppToDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageName, deviceId, options }: { packageName: string; deviceId: string; options?: Record<string, unknown> }) =>
      mdmApi.apps.deployToDevice(packageName, deviceId, options),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.deviceCommands(deviceId) });
      toast.success("App deployment initiated");
    },
    onError: (error) => {
      toast.error(`Failed to deploy app: ${error.message}`);
    },
  });
}

export function useDeployAppToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageName, groupId }: { packageName: string; groupId: string }) =>
      mdmApi.apps.deployToGroup(packageName, groupId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.commands() });
      toast.success(`App deployed to ${result.succeeded}/${result.total} devices`);
    },
    onError: (error) => {
      toast.error(`Failed to deploy app: ${error.message}`);
    },
  });
}

// ============================================
// Group Hooks
// ============================================

export function useGroups() {
  return useQuery({
    queryKey: mdmKeys.groupList(),
    queryFn: mdmApi.groups.list,
  });
}

export function useGroupDetails(id: string) {
  return useQuery({
    queryKey: mdmKeys.groupDetail(id),
    queryFn: () => mdmApi.groups.get(id),
    enabled: !!id,
  });
}

export function useGroupDevices(id: string) {
  return useQuery({
    queryKey: mdmKeys.groupDevices(id),
    queryFn: () => mdmApi.groups.getDevices(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Group, "id" | "createdAt" | "updatedAt">) =>
      mdmApi.groups.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.groupList() });
      toast.success("Group created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Group> }) =>
      mdmApi.groups.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.groupList() });
      queryClient.invalidateQueries({ queryKey: mdmKeys.groupDetail(id) });
      toast.success("Group updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update group: ${error.message}`);
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mdmApi.groups.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.groupList() });
      toast.success("Group deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete group: ${error.message}`);
    },
  });
}

export function useSyncGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mdmApi.groups.syncAll(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.commands() });
      toast.success(`Synced ${result.succeeded}/${result.total} devices`);
    },
    onError: (error) => {
      toast.error(`Failed to sync group: ${error.message}`);
    },
  });
}

// ============================================
// Bulk Operation Hooks
// ============================================

export function useBulkCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceIds, commandType, payload }: { deviceIds: string[]; commandType: string; payload?: Record<string, unknown> }) =>
      mdmApi.bulk.sendCommand(deviceIds, commandType, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.commands() });
      toast.success(`Command sent to ${result.succeeded}/${result.total} devices`);
    },
    onError: (error) => {
      toast.error(`Failed to send bulk command: ${error.message}`);
    },
  });
}

export function useBulkApplyPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceIds, policyId }: { deviceIds: string[]; policyId: string }) =>
      mdmApi.bulk.applyPolicy(deviceIds, policyId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: mdmKeys.devices() });
      toast.success(`Policy applied to ${result.succeeded}/${result.total} devices`);
    },
    onError: (error) => {
      toast.error(`Failed to apply policy: ${error.message}`);
    },
  });
}

// ============================================
// Command Hooks
// ============================================

export function useCommands(options?: { deviceId?: string; status?: string; limit?: number }) {
  return useQuery({
    queryKey: mdmKeys.commandList(options),
    queryFn: () => mdmApi.commands.list(options),
    refetchInterval: 10000,
  });
}

export function usePendingCommands(deviceId?: string) {
  return useQuery({
    queryKey: mdmKeys.commandPending(deviceId),
    queryFn: () => mdmApi.commands.getPending(deviceId),
    refetchInterval: 5000,
  });
}
