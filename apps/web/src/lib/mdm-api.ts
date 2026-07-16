/**
 * MDM API Client
 * Client for interacting with the OpenMDM backend endpoints
 */

import { env } from "@openmdm-demo/env/web";
import type {
  Device,
  Policy,
  Application,
  Command,
  Group,
  Event,
  DashboardStats,
  DeviceBreakdown,
  BulkOperationResult,
  DeviceListResponse,
} from "./mdm-types";

const BASE_URL = env.NEXT_PUBLIC_SERVER_URL;

async function fetchMDM<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}/mdm${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Dashboard & Analytics
// ============================================

export const mdmDashboard = {
  getStats: () => fetchMDM<DashboardStats>("/dashboard/stats"),
  getDeviceBreakdown: () => fetchMDM<DeviceBreakdown>("/dashboard/device-breakdown"),
  getRecentEvents: (limit = 50) =>
    fetchMDM<{ events: Event[] }>(`/dashboard/events?limit=${limit}`),
};

// ============================================
// Device Operations
// ============================================

export const mdmDevices = {
  list: async (options?: { status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", String(options.limit));
    const query = params.toString();
    const response = await fetchMDM<DeviceListResponse | Device[]>(`/devices${query ? `?${query}` : ""}`);
    // Handle both formats: { devices: [...] } or [...]
    if (Array.isArray(response)) {
      return response;
    }
    return response.devices;
  },

  get: (id: string) => fetchMDM<Device>(`/devices/${id}`),

  getDetails: (id: string) => fetchMDM<Device>(`/devices/${id}/details`),

  update: (id: string, data: Partial<Device>) =>
    fetchMDM<Device>(`/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchMDM<{ success: boolean }>(`/devices/${id}`, { method: "DELETE" }),

  assignGroup: (id: string, groupId: string, applyPolicy = true) =>
    fetchMDM<Device>(`/devices/${id}/assign-group`, {
      method: "POST",
      body: JSON.stringify({ groupId, applyPolicy }),
    }),

  assignPolicy: (id: string, policyId: string) =>
    fetchMDM<Device>(`/devices/${id}/policy`, {
      method: "POST",
      body: JSON.stringify({ policyId }),
    }),

  block: (id: string, reason: string, wipe = false) =>
    fetchMDM<Device>(`/devices/${id}/block`, {
      method: "POST",
      body: JSON.stringify({ reason, wipe }),
    }),

  unblock: (id: string) =>
    fetchMDM<Device>(`/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "enrolled" }),
    }),

  sync: (id: string) =>
    fetchMDM<Command>(`/devices/${id}/sync`, { method: "POST" }),

  reboot: (id: string) =>
    fetchMDM<Command>(`/devices/${id}/reboot`, { method: "POST" }),

  lock: (id: string, message?: string) =>
    fetchMDM<Command>(`/devices/${id}/lock`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  wipe: (id: string, preserveSdCard = false) =>
    fetchMDM<Command>(`/devices/${id}/wipe`, {
      method: "POST",
      body: JSON.stringify({ preserveSdCard }),
    }),

  getCommandHistory: async (id: string, limit = 20) => {
    const response = await fetchMDM<{ commands: Command[] } | Command[]>(`/devices/${id}/command-history?limit=${limit}`);
    return Array.isArray(response) ? response : response.commands;
  },

  sendCommand: (id: string, type: string, payload?: Record<string, unknown>) =>
    fetchMDM<Command>(`/devices/${id}/command`, {
      method: "POST",
      body: JSON.stringify({ type, payload }),
    }),
};

// ============================================
// Kiosk Operations
// ============================================

export const mdmKiosk = {
  enable: (deviceId: string, mainApp: string, allowedApps?: string[]) =>
    fetchMDM<Command>(`/devices/${deviceId}/kiosk/enable`, {
      method: "POST",
      body: JSON.stringify({ mainApp, allowedApps }),
    }),

  disable: (deviceId: string) =>
    fetchMDM<Command>(`/devices/${deviceId}/kiosk/disable`, { method: "POST" }),
};

// ============================================
// Policy Operations
// ============================================

export const mdmPolicies = {
  list: async () => {
    const response = await fetchMDM<{ policies: Policy[] } | Policy[]>("/policies");
    return Array.isArray(response) ? response : response.policies;
  },

  get: (id: string) => fetchMDM<Policy>(`/policies/${id}`),

  create: (data: Omit<Policy, "id" | "createdAt" | "updatedAt">) =>
    fetchMDM<Policy>("/policies", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Policy>) =>
    fetchMDM<Policy>(`/policies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchMDM<{ success: boolean }>(`/policies/${id}`, { method: "DELETE" }),

  getDevices: (id: string) =>
    fetchMDM<Device[]>(`/policies/${id}/devices`),
};

// ============================================
// Application Operations
// ============================================

export const mdmApps = {
  list: async () => {
    const response = await fetchMDM<{ applications: Application[] } | Application[]>("/applications");
    // Handle both response formats: { applications: [...] } or [...]
    return Array.isArray(response) ? response : response.applications;
  },

  get: (id: string) => fetchMDM<Application>(`/applications/${id}`),

  getByPackage: (packageName: string, version?: string) => {
    const params = new URLSearchParams({ packageName });
    if (version) params.set("version", version);
    return fetchMDM<Application>(`/applications/package?${params}`);
  },

  register: (data: Omit<Application, "id" | "createdAt" | "updatedAt" | "isActive">) =>
    fetchMDM<Application>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Application>) =>
    fetchMDM<Application>(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchMDM<{ success: boolean }>(`/applications/${id}`, { method: "DELETE" }),

  deployToDevice: (packageName: string, deviceId: string, options?: Record<string, unknown>) =>
    fetchMDM<{ command: Command; app: Application }>(
      `/apps/${packageName}/deploy/device/${deviceId}`,
      {
        method: "POST",
        body: JSON.stringify(options || {}),
      }
    ),

  deployToGroup: (packageName: string, groupId: string) =>
    fetchMDM<BulkOperationResult>(`/apps/${packageName}/deploy/group/${groupId}`, {
      method: "POST",
    }),

  deployToPolicy: (packageName: string, policyId: string) =>
    fetchMDM<BulkOperationResult>(`/apps/${packageName}/deploy/policy/${policyId}`, {
      method: "POST",
    }),
};

// ============================================
// Group Operations
// ============================================

export const mdmGroups = {
  list: async () => {
    const response = await fetchMDM<{ groups: Group[] } | Group[]>("/groups");
    return Array.isArray(response) ? response : response.groups;
  },

  get: (id: string) => fetchMDM<Group>(`/groups/${id}`),

  create: (data: Omit<Group, "id" | "createdAt" | "updatedAt">) =>
    fetchMDM<Group>("/groups", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Group>) =>
    fetchMDM<Group>(`/groups/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchMDM<{ success: boolean }>(`/groups/${id}`, { method: "DELETE" }),

  getDevices: (id: string) =>
    fetchMDM<Device[]>(`/groups/${id}/devices`),

  syncAll: (id: string) =>
    fetchMDM<BulkOperationResult>(`/groups/${id}/sync-all`, { method: "POST" }),
};

// ============================================
// Command Operations
// ============================================

export const mdmCommands = {
  list: async (options?: { deviceId?: string; status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.deviceId) params.set("deviceId", options.deviceId);
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", String(options.limit));
    const query = params.toString();
    const response = await fetchMDM<{ commands: Command[] } | Command[]>(`/commands${query ? `?${query}` : ""}`);
    return Array.isArray(response) ? response : response.commands;
  },

  get: (id: string) => fetchMDM<Command>(`/commands/${id}`),

  getPending: async (deviceId?: string) => {
    const params = deviceId ? `?deviceId=${deviceId}` : "";
    const response = await fetchMDM<{ commands: Command[] } | Command[]>(`/commands/pending${params}`);
    return Array.isArray(response) ? response : response.commands;
  },
};

// ============================================
// Bulk Operations
// ============================================

export const mdmBulk = {
  sendCommand: (
    deviceIds: string[],
    commandType: string,
    payload?: Record<string, unknown>
  ) =>
    fetchMDM<BulkOperationResult>("/bulk/command", {
      method: "POST",
      body: JSON.stringify({ deviceIds, commandType, payload }),
    }),

  applyPolicy: (deviceIds: string[], policyId: string) =>
    fetchMDM<BulkOperationResult>("/bulk/apply-policy", {
      method: "POST",
      body: JSON.stringify({ deviceIds, policyId }),
    }),
};

// ============================================
// Enrollment (Android QR provisioning)
// ============================================

export interface EnrollmentQrOptions {
  /** MDM base URL as reachable FROM THE DEVICE (not necessarily localhost). */
  serverUrl?: string;
  /** Agent APK download location — required for factory-reset provisioning. */
  apkUrl?: string;
  /** APK signing-cert SHA-256, URL-safe base64 — required alongside apkUrl. */
  checksum?: string;
  policyId?: string;
  groupId?: string;
}

function enrollmentQrParams(options: EnrollmentQrOptions = {}): URLSearchParams {
  const params = new URLSearchParams();
  if (options.serverUrl) params.set("serverUrl", options.serverUrl);
  if (options.apkUrl) params.set("apkUrl", options.apkUrl);
  if (options.checksum) params.set("checksum", options.checksum);
  if (options.policyId) params.set("policyId", options.policyId);
  if (options.groupId) params.set("groupId", options.groupId);
  return params;
}

export const mdmEnrollment = {
  /** Default MDM base URL embedded in the QR when none is provided. */
  defaultServerUrl: `${BASE_URL}/mdm`,

  qrSvg: async (options?: EnrollmentQrOptions) => {
    const params = enrollmentQrParams(options);
    params.set("format", "svg");
    const response = await fetch(`${BASE_URL}/mdm/enrollment/qr?${params}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }
    return response.text();
  },

  qrPayload: (options?: EnrollmentQrOptions) =>
    fetchMDM<Record<string, unknown>>(
      `/enrollment/qr?${enrollmentQrParams(options)}`
    ),
};

// ============================================
// Event Operations
// ============================================

export const mdmEvents = {
  list: (options?: { deviceId?: string; type?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.deviceId) params.set("deviceId", options.deviceId);
    if (options?.type) params.set("type", options.type);
    if (options?.limit) params.set("limit", String(options.limit));
    const query = params.toString();
    return fetchMDM<Event[]>(`/events${query ? `?${query}` : ""}`);
  },
};

// Export all as a single object
export const mdmApi = {
  dashboard: mdmDashboard,
  devices: mdmDevices,
  enrollment: mdmEnrollment,
  kiosk: mdmKiosk,
  policies: mdmPolicies,
  apps: mdmApps,
  groups: mdmGroups,
  commands: mdmCommands,
  bulk: mdmBulk,
  events: mdmEvents,
};
