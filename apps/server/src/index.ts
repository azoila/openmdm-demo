import { createContext } from "@openmdm-demo/api/context";
import { appRouter } from "@openmdm-demo/api/routers/index";
import { auth } from "@openmdm-demo/auth";
import { env } from "@openmdm-demo/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import QRCode from "qrcode";
import { honoAdapter } from "@openmdm/hono";
import {
  mdm,
  deviceOperations,
  appOperations,
  kioskOperations,
  bulkOperations,
  analytics,
} from "./mdm";

const app = new Hono();

app.use(logger());

// CORS configuration
const allowedOrigins = [
  env.CORS_ORIGIN,
  "http://localhost:3001",
  "http://localhost:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3000",
].filter((o) => o && o !== "*");

app.use(
  "/*",
  cors({
    origin: (origin) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return env.CORS_ORIGIN === "*" ? "*" : allowedOrigins[0] || null;
      // Allow if in whitelist or wildcard
      if (env.CORS_ORIGIN === "*" || allowedOrigins.includes(origin)) {
        return origin;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Device-Id"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ============================================
// Mount OpenMDM Core Routes
// ============================================

const mdmRoutes = honoAdapter(mdm);
app.route("/mdm", mdmRoutes);

// ============================================
// Dashboard & Analytics Endpoints
// ============================================

app.get("/mdm/dashboard/stats", async (c) => {
  const stats = await analytics.getDashboardStats();
  return c.json(stats);
});

app.get("/mdm/dashboard/device-breakdown", async (c) => {
  const breakdown = await analytics.getDeviceBreakdown();
  return c.json(breakdown);
});

app.get("/mdm/dashboard/events", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const events = await analytics.getRecentEvents(limit);
  return c.json({ events });
});

// ============================================
// Extended Device Operations
// ============================================

// Get device with full details (groups, policy)
app.get("/mdm/devices/:id/details", async (c) => {
  const device = await deviceOperations.getDeviceDetails(c.req.param("id"));
  if (!device) {
    return c.json({ error: "Device not found" }, 404);
  }
  return c.json(device);
});

// Assign device to group
app.post("/mdm/devices/:id/assign-group", async (c) => {
  const { groupId, applyPolicy } = await c.req.json();
  const device = await deviceOperations.assignToGroup(
    c.req.param("id"),
    groupId,
    applyPolicy ?? true
  );
  return c.json(device);
});

// Block device
app.post("/mdm/devices/:id/block", async (c) => {
  const { reason, wipe } = await c.req.json();
  const device = await deviceOperations.blockDevice(
    c.req.param("id"),
    reason,
    wipe ?? false
  );
  return c.json(device);
});

// Get device command history
app.get("/mdm/devices/:id/command-history", async (c) => {
  const limit = parseInt(c.req.query("limit") || "20");
  const commands = await analytics.getDeviceCommandHistory(c.req.param("id"), limit);
  return c.json({ commands });
});

// ============================================
// Application Deployment Endpoints
// ============================================

// Deploy app to single device
app.post("/mdm/apps/:packageName/deploy/device/:deviceId", async (c) => {
  try {
    const options = await c.req.json().catch(() => ({}));
    const result = await appOperations.deployToDevice(
      c.req.param("packageName"),
      c.req.param("deviceId"),
      options
    );
    return c.json(result, 201);
  } catch (error) {
    return c.json({ error: String(error) }, 400);
  }
});

// Deploy app to all devices in a group
app.post("/mdm/apps/:packageName/deploy/group/:groupId", async (c) => {
  const result = await appOperations.deployToGroup(
    c.req.param("packageName"),
    c.req.param("groupId")
  );
  return c.json(result, 201);
});

// Deploy app to all devices with a policy
app.post("/mdm/apps/:packageName/deploy/policy/:policyId", async (c) => {
  const result = await appOperations.deployToPolicy(
    c.req.param("packageName"),
    c.req.param("policyId")
  );
  return c.json(result, 201);
});

// ============================================
// Kiosk Mode Endpoints
// ============================================

// Enable kiosk mode
app.post("/mdm/devices/:id/kiosk/enable", async (c) => {
  const { mainApp, allowedApps } = await c.req.json();
  const command = await kioskOperations.enable(
    c.req.param("id"),
    mainApp,
    allowedApps
  );
  return c.json(command, 201);
});

// Disable kiosk mode
app.post("/mdm/devices/:id/kiosk/disable", async (c) => {
  const command = await kioskOperations.disable(c.req.param("id"));
  return c.json(command, 201);
});

// ============================================
// Android Enrollment — QR Provisioning
// ============================================

// Emits the Android device-owner provisioning payload the OpenMDM agent's
// QREnrollmentParser understands: the standard DPC extras plus the
// `openmdm.*` admin-extras bundle (server URL, enrollment secret). Scan it
// on a factory-reset device (tap the welcome screen 6 times) to install the
// agent and enroll against this server. See docs/android-quickstart.md.
//
// The payload contains MDM_DEVICE_SECRET, so this route requires a
// dashboard session.
//
// Query params:
//   format=svg            render a scannable QR (default: raw JSON payload)
//   serverUrl=<url>       MDM base URL as reachable FROM THE DEVICE
//                         (default: BETTER_AUTH_URL + /mdm — localhost only
//                         works for emulators via 10.0.2.2)
//   apkUrl=<url>          agent APK download location (required for
//                         factory-reset provisioning; omit if the agent is
//                         already installed)
//   checksum=<base64url>  APK signing-cert SHA-256, URL-safe base64
//                         (required alongside apkUrl)
//   policyId, groupId     optional initial assignment
app.get("/mdm/enrollment/qr", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json(
      { error: "Authentication required — sign in to the dashboard first" },
      401
    );
  }

  const serverUrl = c.req.query("serverUrl") ?? `${env.BETTER_AUTH_URL}/mdm`;
  const apkUrl = c.req.query("apkUrl");
  const checksum = c.req.query("checksum");
  const policyId = c.req.query("policyId");
  const groupId = c.req.query("groupId");

  const payload: Record<string, unknown> = {
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME":
      "com.openmdm.agent",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
      "com.openmdm.agent/.receiver.MDMDeviceAdminReceiver",
    "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
      "openmdm.server_url": serverUrl,
      "openmdm.device_secret": env.MDM_DEVICE_SECRET,
      ...(policyId ? { "openmdm.policy_id": policyId } : {}),
      ...(groupId ? { "openmdm.group_id": groupId } : {}),
    },
  };
  if (apkUrl) {
    payload["android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION"] =
      apkUrl;
  }
  if (checksum) {
    payload["android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM"] =
      checksum;
  }

  if (c.req.query("format") === "svg") {
    const svg = await QRCode.toString(JSON.stringify(payload), {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
    });
    return c.body(svg, 200, { "Content-Type": "image/svg+xml" });
  }

  return c.json(payload);
});

// ============================================
// Bulk Operations Endpoints
// ============================================

// Send command to multiple devices
app.post("/mdm/bulk/command", async (c) => {
  const { deviceIds, commandType, payload } = await c.req.json();
  const result = await bulkOperations.sendCommand(deviceIds, commandType, payload);
  return c.json(result, 201);
});

// Apply policy to multiple devices
app.post("/mdm/bulk/apply-policy", async (c) => {
  const { deviceIds, policyId } = await c.req.json();
  const result = await bulkOperations.applyPolicy(deviceIds, policyId);
  return c.json(result);
});

// Sync all devices in a group
app.post("/mdm/groups/:id/sync-all", async (c) => {
  const result = await bulkOperations.syncGroup(c.req.param("id"));
  return c.json(result, 201);
});

// ============================================
// ORPC Handlers
// ============================================

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

// ============================================
// API Documentation
// ============================================

app.get("/", (c) => {
  return c.json({
    name: "OpenMDM Demo Server",
    version: "1.0.0",
    description: "Production-ready MDM backend demonstrating full OpenMDM capabilities",
    endpoints: {
      auth: "/api/auth/*",
      rpc: "/rpc/*",
      apiDocs: "/api-reference/*",
      mdm: {
        // Core OpenMDM routes (via honoAdapter)
        core: {
          health: "GET /mdm/health",
          agent: {
            enroll: "POST /mdm/agent/enroll (rate-limited)",
            enrollChallenge: "GET /mdm/agent/enroll/challenge (rate-limited)",
            refreshToken: "POST /mdm/agent/refresh-token",
            heartbeat: "POST /mdm/agent/heartbeat",
            config: "GET /mdm/agent/config",
            pushToken: "POST /mdm/agent/push-token",
            pushTokenRemove: "DELETE /mdm/agent/push-token",
            commandsPending: "GET /mdm/agent/commands/pending",
            commandAck: "POST /mdm/agent/commands/:id/ack",
            commandComplete: "POST /mdm/agent/commands/:id/complete",
            commandFail: "POST /mdm/agent/commands/:id/fail",
            events: "POST /mdm/agent/events",
          },
          devices: "GET|POST|PATCH|DELETE /mdm/devices/*",
          policies: "GET|POST|PATCH|DELETE /mdm/policies/*",
          applications: "GET|POST|PATCH|DELETE /mdm/applications/*",
          groups: "GET|POST|PATCH|DELETE /mdm/groups/*",
          commands: "GET|POST /mdm/commands/*",
          events: "GET /mdm/events/*",
        },
        // Dashboard & Analytics
        dashboard: {
          stats: "GET /mdm/dashboard/stats",
          deviceBreakdown: "GET /mdm/dashboard/device-breakdown",
          events: "GET /mdm/dashboard/events?limit=50",
        },
        // Extended device operations
        deviceOps: {
          details: "GET /mdm/devices/:id/details",
          assignGroup: "POST /mdm/devices/:id/assign-group",
          block: "POST /mdm/devices/:id/block",
          commandHistory: "GET /mdm/devices/:id/command-history",
          sync: "POST /mdm/devices/:id/sync",
          reboot: "POST /mdm/devices/:id/reboot",
          lock: "POST /mdm/devices/:id/lock",
          wipe: "POST /mdm/devices/:id/wipe",
        },
        // Application deployment
        appDeploy: {
          toDevice: "POST /mdm/apps/:pkg/deploy/device/:deviceId",
          toGroup: "POST /mdm/apps/:pkg/deploy/group/:groupId",
          toPolicy: "POST /mdm/apps/:pkg/deploy/policy/:policyId",
        },
        // Android enrollment
        enrollment: {
          qr: "GET /mdm/enrollment/qr?format=svg[&serverUrl=...&apkUrl=...&checksum=...] (requires session)",
        },
        // Kiosk mode
        kiosk: {
          enable: "POST /mdm/devices/:id/kiosk/enable",
          disable: "POST /mdm/devices/:id/kiosk/disable",
        },
        // Bulk operations
        bulk: {
          command: "POST /mdm/bulk/command",
          applyPolicy: "POST /mdm/bulk/apply-policy",
          syncGroup: "POST /mdm/groups/:id/sync-all",
        },
      },
    },
    features: [
      "Device enrollment & management",
      "Policy management (Default, Kiosk, High Security, Field Worker)",
      "Application deployment with auto-grant permissions",
      "Kiosk mode with lock task",
      "Device groups & hierarchy",
      "Bulk operations",
      "Real-time dashboard & analytics",
      "Command queue & execution tracking",
      "Battery optimization whitelisting",
      "Location tracking",
    ],
  });
});

export default app;
