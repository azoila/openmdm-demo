/**
 * MDM Types for Frontend
 */

// Device status enum
export type DeviceStatus = "pending" | "enrolled" | "unenrolled" | "blocked";

// Command status enum
export type CommandStatus = "pending" | "sent" | "acknowledged" | "completed" | "failed" | "cancelled";

// Push provider enum
export type PushProvider = "fcm" | "mqtt" | "polling" | "websocket";

// Deployment action enum
export type DeploymentAction = "install" | "update" | "uninstall";

// Device interface
export interface Device {
  id: string;
  enrollmentId: string | null;
  status: DeviceStatus;
  name: string | null;
  model: string | null;
  manufacturer: string | null;
  osVersion: string | null;
  serial: string | null;
  imei: string | null;
  macAddress: string | null;
  batteryLevel: number | null;
  storageTotal: number | null;
  storageFree: number | null;
  latitude: number | null;
  longitude: number | null;
  installedApps: string[] | null;
  policyId: string | null;
  lastHeartbeat: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  // Extended fields from details endpoint
  groups?: Group[];
  policy?: Policy | null;
}

// Policy interface
export interface Policy {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  settings: PolicySettings;
  createdAt: string;
  updatedAt: string;
}

export interface PolicySettings {
  heartbeatInterval?: number;
  locationEnabled?: boolean;
  locationReportInterval?: number;
  passwordPolicy?: {
    required?: boolean;
    minLength?: number;
    complexity?: "numeric" | "alphabetic" | "alphanumeric" | "complex";
    maxFailedAttempts?: number;
    expirationDays?: number;
  };
  encryptionRequired?: boolean;
  factoryResetProtection?: boolean;
  safeBootDisabled?: boolean;
  kioskMode?: boolean;
  mainApp?: string;
  allowedApps?: string[];
  kioskExitPassword?: string;
  lockStatusBar?: boolean;
  lockNavigationBar?: boolean;
  lockSettings?: boolean;
  lockPowerButton?: boolean;
  blockInstall?: boolean;
  blockUninstall?: boolean;
  bluetooth?: "on" | "off" | "user";
  wifi?: "on" | "off" | "user";
  camera?: "on" | "off" | "user";
  microphone?: "on" | "off" | "user";
  usb?: "on" | "off" | "user";
  nfc?: "on" | "off" | "user";
  gps?: "on" | "off" | "user";
  mobileData?: "on" | "off" | "user";
}

// Application interface
export interface Application {
  id: string;
  name: string;
  packageName: string;
  version: string;
  versionCode: number;
  url: string | null;
  hash: string | null;
  showIcon: boolean;
  runAfterInstall: boolean;
  runAtBoot: boolean;
  isSystem: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Command interface
export interface Command {
  id: string;
  deviceId: string;
  type: string;
  payload: Record<string, unknown> | null;
  status: CommandStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  sentAt: string | null;
  acknowledgedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// Group interface
export interface Group {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  policyId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Event interface
export interface Event {
  id: string;
  deviceId: string;
  type: string;
  data: Record<string, unknown> | null;
  createdAt: string;
}

// Dashboard stats interface
export interface DashboardStats {
  devices: {
    total: number;
    enrolled: number;
    pending: number;
    blocked: number;
    online: number;
    offline: number;
    lowBattery: number;
  };
  policies: {
    total: number;
    active: number;
  };
  applications: {
    total: number;
    active: number;
  };
  groups: {
    total: number;
  };
  commands: {
    pending: number;
    last24h: {
      total: number;
      completed: number;
      failed: number;
      successRate: number;
    };
  };
}

// Device breakdown interface
export interface DeviceBreakdown {
  byStatus: Record<string, number>;
  byManufacturer: Record<string, number>;
  byOsVersion: Record<string, number>;
}

// Bulk operation result
export interface BulkOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    deviceId: string;
    success: boolean;
    commandId?: string;
    error?: string;
  }>;
}

// Device list response
export interface DeviceListResponse {
  devices: Device[];
  cursor?: string;
}
