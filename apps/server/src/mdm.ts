/**
 * OpenMDM Production-Ready Backend Configuration
 *
 * Demonstrates full MDM capabilities for enterprise deployment.
 */

import { createMDM } from "@openmdm/core";
import { drizzleAdapter } from "@openmdm/drizzle-adapter";
import { db } from "@openmdm-demo/db";
import {
  mdmDevices,
  mdmPolicies,
  mdmApplications,
  mdmCommands,
  mdmEvents,
  mdmGroups,
  mdmDeviceGroups,
  mdmPushTokens,
} from "@openmdm-demo/db/schema/mdm";
import { env } from "@openmdm-demo/env/server";

// ============================================
// Database Adapter Configuration
// ============================================

const databaseAdapter = drizzleAdapter(db as any, {
  tables: {
    devices: mdmDevices,
    policies: mdmPolicies,
    applications: mdmApplications,
    commands: mdmCommands,
    events: mdmEvents,
    groups: mdmGroups,
    deviceGroups: mdmDeviceGroups,
    pushTokens: mdmPushTokens,
  },
});

// ============================================
// MDM Instance Configuration
// ============================================

export const mdm = createMDM({
  database: databaseAdapter,
  serverUrl: env.BETTER_AUTH_URL,

  // Enrollment configuration
  enrollment: {
    autoEnroll: true,
    // In production, use: deviceSecret: env.MDM_DEVICE_SECRET
  },

  // Push notification (polling for demo, FCM/MQTT for production)
  push: {
    provider: "polling",
    pollingInterval: 30,
  },

  // Webhook configuration for external integrations
  webhooks: {
    endpoints: [],
    signingSecret: env.BETTER_AUTH_SECRET,
    retry: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
    },
  },
});

// ============================================
// Seed Data - Policies
// ============================================

const SEED_POLICIES = [
  {
    name: "Default Policy",
    description: "Standard policy for all managed devices",
    isDefault: true,
    settings: {
      heartbeatInterval: 60,
      locationEnabled: true,
      locationReportInterval: 300,
      passwordPolicy: {
        required: true,
        minLength: 6,
        complexity: "numeric" as const,
      },
      encryptionRequired: true,
      bluetooth: "user" as const,
      wifi: "user" as const,
      camera: "user" as const,
      usb: "off" as const,
    },
  },
  {
    name: "Kiosk Mode",
    description: "Locked-down single-app kiosk configuration",
    isDefault: false,
    settings: {
      kioskMode: true,
      mainApp: "com.midiamob.androidplayer",
      allowedApps: ["com.midiamob.androidplayer", "com.openmdm.agent"],
      kioskExitPassword: "admin123",
      lockStatusBar: true,
      lockNavigationBar: true,
      lockSettings: true,
      lockPowerButton: false,
      blockInstall: true,
      blockUninstall: true,
      heartbeatInterval: 30,
      bluetooth: "off" as const,
      wifi: "on" as const,
      camera: "off" as const,
      usb: "off" as const,
    },
  },
  {
    name: "High Security",
    description: "Maximum security for sensitive deployments",
    isDefault: false,
    settings: {
      heartbeatInterval: 30,
      passwordPolicy: {
        required: true,
        minLength: 8,
        complexity: "complex" as const,
        maxFailedAttempts: 5,
        expirationDays: 90,
      },
      encryptionRequired: true,
      factoryResetProtection: true,
      safeBootDisabled: true,
      bluetooth: "off" as const,
      wifi: "user" as const,
      camera: "off" as const,
      microphone: "off" as const,
      usb: "off" as const,
      nfc: "off" as const,
    },
  },
  {
    name: "Field Worker",
    description: "Configuration for field/outdoor workers",
    isDefault: false,
    settings: {
      heartbeatInterval: 120,
      locationEnabled: true,
      locationReportInterval: 60,
      passwordPolicy: {
        required: true,
        minLength: 4,
        complexity: "numeric" as const,
      },
      bluetooth: "on" as const,
      wifi: "on" as const,
      gps: "on" as const,
      mobileData: "on" as const,
      camera: "on" as const,
    },
  },
];

// ============================================
// Seed Data - Groups
// ============================================

const SEED_GROUPS = [
  { name: "All Devices", description: "Root group for all managed devices" },
  { name: "Unassigned", description: "Newly enrolled devices pending assignment" },
  { name: "Production", description: "Devices in production environment" },
  { name: "Staging", description: "Devices for staging/testing" },
  { name: "Kiosk Terminals", description: "Public-facing kiosk devices" },
  { name: "Field Devices", description: "Devices used by field workers" },
  { name: "Office", description: "Office-based devices" },
];

// ============================================
// Seed Data - Applications
// ============================================

const SEED_APPLICATIONS = [
  {
    name: "Midiamob Player",
    packageName: "com.midiamob.androidplayer",
    version: "1.0.0",
    versionCode: 1,
    url: "https://storage.example.com/apps/midiamob-player-1.0.0.apk",
    showIcon: true,
    runAfterInstall: true,
    runAtBoot: true,
    metadata: {
      autoGrantPermissions: true,
      whitelistBattery: true,
      permissions: [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
      ],
    },
  },
  {
    name: "OpenMDM Agent",
    packageName: "com.openmdm.agent",
    version: "1.0.0",
    versionCode: 1,
    url: "https://storage.example.com/apps/openmdm-agent-1.0.0.apk",
    showIcon: false,
    runAfterInstall: false,
    runAtBoot: true,
    isSystem: true,
    metadata: {
      autoGrantPermissions: true,
      whitelistBattery: true,
    },
  },
];

// ============================================
// Initialization
// ============================================

let initialized = false;

export async function initializeMDM(): Promise<void> {
  if (initialized) return;

  console.log("[MDM] Starting initialization...");

  // Seed policies
  const existingPolicies = await mdm.policies.list();
  for (const policy of SEED_POLICIES) {
    const exists = existingPolicies.some((p) => p.name === policy.name);
    if (!exists) {
      await mdm.policies.create(policy);
      console.log(`[MDM] Created policy: ${policy.name}`);
    }
  }

  // Seed groups
  const existingGroups = await mdm.groups.list();
  for (const group of SEED_GROUPS) {
    const exists = existingGroups.some((g) => g.name === group.name);
    if (!exists) {
      await mdm.groups.create(group);
      console.log(`[MDM] Created group: ${group.name}`);
    }
  }

  // Seed applications
  const existingApps = await mdm.apps.list();
  for (const app of SEED_APPLICATIONS) {
    const exists = existingApps.some((a) => a.packageName === app.packageName);
    if (!exists) {
      await mdm.apps.register(app);
      console.log(`[MDM] Registered application: ${app.name}`);
    }
  }

  initialized = true;
  console.log("[MDM] Initialization complete");
}

// ============================================
// Device Operations
// ============================================

export const deviceOperations = {
  /**
   * Get device with full details including groups and policy
   */
  async getDeviceDetails(deviceId: string) {
    const device = await mdm.devices.get(deviceId);
    if (!device) return null;

    const groups = await mdm.devices.getGroups(deviceId);
    const policy = device.policyId
      ? await mdm.policies.get(device.policyId)
      : await mdm.policies.getDefault();

    return {
      ...device,
      groups,
      policy,
    };
  },

  /**
   * Assign device to group and optionally apply group policy
   */
  async assignToGroup(deviceId: string, groupId: string, applyPolicy = true) {
    await mdm.devices.addToGroup(deviceId, groupId);

    if (applyPolicy) {
      const group = await mdm.groups.get(groupId);
      if (group?.policyId) {
        await mdm.devices.assignPolicy(deviceId, group.policyId);
      }
    }

    return this.getDeviceDetails(deviceId);
  },

  /**
   * Block device and optionally wipe
   */
  async blockDevice(deviceId: string, reason: string, wipe = false) {
    await mdm.devices.update(deviceId, { status: "blocked" });

    if (wipe) {
      await mdm.devices.wipe(deviceId, false);
    }

    return mdm.devices.get(deviceId);
  },

  /**
   * Send sync command and return pending commands count
   */
  async syncDevice(deviceId: string) {
    const command = await mdm.devices.sync(deviceId);
    const pending = await mdm.commands.getPending(deviceId);
    return { command, pendingCount: pending.length };
  },
};

// ============================================
// Application Operations
// ============================================

export const appOperations = {
  /**
   * Deploy app to device with full permission management
   */
  async deployToDevice(
    packageName: string,
    deviceId: string,
    options?: {
      version?: string;
      autoGrantPermissions?: boolean;
      whitelistBattery?: boolean;
      runAfterInstall?: boolean;
    }
  ) {
    const app = await mdm.apps.getByPackage(packageName, options?.version);
    if (!app) {
      throw new Error(`Application ${packageName} not found`);
    }

    const metadata = app.metadata as Record<string, unknown> | null;
    const permissions = (metadata?.permissions as string[]) ?? [];

    const command = await mdm.devices.sendCommand(deviceId, {
      type: "installApp",
      payload: {
        packageName: app.packageName,
        version: app.version,
        versionCode: app.versionCode,
        url: app.url,
        hash: app.hash,
        autoGrantPermissions: options?.autoGrantPermissions ?? true,
        whitelistBattery: options?.whitelistBattery ?? true,
        runAfterInstall: options?.runAfterInstall ?? app.runAfterInstall,
        permissions,
      },
    });

    return { command, app };
  },

  /**
   * Deploy app to all devices in a group
   */
  async deployToGroup(packageName: string, groupId: string) {
    const devices = await mdm.groups.getDevices(groupId);
    const results = [];

    for (const device of devices) {
      try {
        const result = await this.deployToDevice(packageName, device.id);
        results.push({ deviceId: device.id, success: true, command: result.command });
      } catch (error) {
        results.push({ deviceId: device.id, success: false, error: String(error) });
      }
    }

    return {
      total: devices.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },

  /**
   * Deploy app to all devices with a specific policy
   */
  async deployToPolicy(packageName: string, policyId: string) {
    const devices = await mdm.policies.getDevices(policyId);
    const results = [];

    for (const device of devices) {
      try {
        const result = await this.deployToDevice(packageName, device.id);
        results.push({ deviceId: device.id, success: true, command: result.command });
      } catch (error) {
        results.push({ deviceId: device.id, success: false, error: String(error) });
      }
    }

    return {
      total: devices.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
};

// ============================================
// Kiosk Operations
// ============================================

export const kioskOperations = {
  /**
   * Enable kiosk mode on device
   */
  async enable(deviceId: string, mainApp: string, allowedApps?: string[]) {
    // Get kiosk policy
    const policies = await mdm.policies.list();
    const kioskPolicy = policies.find((p) => p.name === "Kiosk Mode");

    if (kioskPolicy) {
      await mdm.devices.assignPolicy(deviceId, kioskPolicy.id);
    }

    // Send enter kiosk command
    const command = await mdm.devices.sendCommand(deviceId, {
      type: "enterKiosk",
      payload: {
        packageName: mainApp,
        allowedApps: allowedApps ?? [mainApp, "com.openmdm.agent"],
      },
    });

    // Add to Kiosk Terminals group
    const groups = await mdm.groups.list();
    const kioskGroup = groups.find((g) => g.name === "Kiosk Terminals");
    if (kioskGroup) {
      await mdm.devices.addToGroup(deviceId, kioskGroup.id);
    }

    return command;
  },

  /**
   * Disable kiosk mode on device
   */
  async disable(deviceId: string) {
    // Restore default policy
    const defaultPolicy = await mdm.policies.getDefault();
    if (defaultPolicy) {
      await mdm.devices.assignPolicy(deviceId, defaultPolicy.id);
    }

    // Send exit kiosk command
    const command = await mdm.devices.sendCommand(deviceId, {
      type: "exitKiosk",
    });

    // Remove from Kiosk Terminals group
    const groups = await mdm.groups.list();
    const kioskGroup = groups.find((g) => g.name === "Kiosk Terminals");
    if (kioskGroup) {
      await mdm.devices.removeFromGroup(deviceId, kioskGroup.id);
    }

    return command;
  },
};

// ============================================
// Bulk Operations
// ============================================

export const bulkOperations = {
  /**
   * Send command to multiple devices
   */
  async sendCommand(
    deviceIds: string[],
    commandType: string,
    payload?: Record<string, unknown>
  ) {
    const results = [];

    for (const deviceId of deviceIds) {
      try {
        const command = await mdm.devices.sendCommand(deviceId, {
          type: commandType as any,
          payload,
        });
        results.push({ deviceId, success: true, commandId: command.id });
      } catch (error) {
        results.push({ deviceId, success: false, error: String(error) });
      }
    }

    return {
      total: deviceIds.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },

  /**
   * Apply policy to multiple devices
   */
  async applyPolicy(deviceIds: string[], policyId: string) {
    const results = [];

    for (const deviceId of deviceIds) {
      try {
        await mdm.devices.assignPolicy(deviceId, policyId);
        results.push({ deviceId, success: true });
      } catch (error) {
        results.push({ deviceId, success: false, error: String(error) });
      }
    }

    return {
      total: deviceIds.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },

  /**
   * Sync all devices in a group
   */
  async syncGroup(groupId: string) {
    const devices = await mdm.groups.getDevices(groupId);
    return this.sendCommand(
      devices.map((d) => d.id),
      "sync"
    );
  },
};

// ============================================
// Dashboard & Analytics
// ============================================

export const analytics = {
  /**
   * Get comprehensive dashboard stats
   */
  async getDashboardStats() {
    const devicesResult = await mdm.devices.list();
    const policies = await mdm.policies.list();
    const apps = await mdm.apps.list();
    const groups = await mdm.groups.list();
    const commands = await mdm.commands.list({ limit: 1000 });

    const devices = devicesResult.devices;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Device stats
    const enrolled = devices.filter((d) => d.status === "enrolled");
    const pending = devices.filter((d) => d.status === "pending");
    const blocked = devices.filter((d) => d.status === "blocked");

    // Online/offline (based on heartbeat within last hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const online = enrolled.filter((d) => {
      if (!d.lastHeartbeat) return false;
      return new Date(d.lastHeartbeat).getTime() > oneHourAgo;
    });

    // Low battery
    const lowBattery = enrolled.filter(
      (d) => d.batteryLevel !== null && d.batteryLevel < 20
    );

    // Command stats (last 24h)
    const recentCommands = commands.filter(
      (c) => new Date(c.createdAt).getTime() > oneDayAgo
    );
    const completedCommands = recentCommands.filter((c) => c.status === "completed");
    const failedCommands = recentCommands.filter((c) => c.status === "failed");
    const pendingCommands = commands.filter((c) => c.status === "pending");

    return {
      devices: {
        total: devices.length,
        enrolled: enrolled.length,
        pending: pending.length,
        blocked: blocked.length,
        online: online.length,
        offline: enrolled.length - online.length,
        lowBattery: lowBattery.length,
      },
      policies: {
        total: policies.length,
        active: policies.filter((p) => !p.isDefault).length,
      },
      applications: {
        total: apps.length,
        active: apps.filter((a) => a.isActive).length,
      },
      groups: {
        total: groups.length,
      },
      commands: {
        pending: pendingCommands.length,
        last24h: {
          total: recentCommands.length,
          completed: completedCommands.length,
          failed: failedCommands.length,
          successRate:
            recentCommands.length > 0
              ? Math.round((completedCommands.length / recentCommands.length) * 100)
              : 100,
        },
      },
    };
  },

  /**
   * Get device distribution by various criteria
   */
  async getDeviceBreakdown() {
    const devicesResult = await mdm.devices.list();
    const devices = devicesResult.devices;

    const byStatus: Record<string, number> = {};
    const byManufacturer: Record<string, number> = {};
    const byOsVersion: Record<string, number> = {};

    for (const device of devices) {
      // By status
      byStatus[device.status] = (byStatus[device.status] || 0) + 1;

      // By manufacturer
      const manufacturer = device.manufacturer || "Unknown";
      byManufacturer[manufacturer] = (byManufacturer[manufacturer] || 0) + 1;

      // By OS version
      const os = device.osVersion || "Unknown";
      byOsVersion[os] = (byOsVersion[os] || 0) + 1;
    }

    return { byStatus, byManufacturer, byOsVersion };
  },

  /**
   * Get recent events
   */
  async getRecentEvents(limit = 50) {
    return mdm.db.listEvents({ limit });
  },

  /**
   * Get command history for a device
   */
  async getDeviceCommandHistory(deviceId: string, limit = 20) {
    return mdm.commands.list({ deviceId, limit });
  },
};

// ============================================
// Initialize on import
// ============================================

initializeMDM().catch(console.error);
