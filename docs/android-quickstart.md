# Android Quick Start — Your First Managed Device in ~10 Minutes

This guide takes you from a running demo server to an enrolled, managed
Android device. No prior Android Enterprise knowledge required.

Two paths — pick one:

| Path | Hardware | Factory reset? | Time | Best for |
|------|----------|----------------|------|----------|
| **A. Emulator + ADB** | none (Android emulator) | no | ~10 min | trying OpenMDM, development |
| **B. QR provisioning** | a physical device you can wipe | yes | ~20 min | the real production-style flow |

Both paths use the OpenMDM Android agent from
[azoila/openmdm-android](https://github.com/azoila/openmdm-android).

---

## Prerequisites

- The demo server running — follow the [README Quick Start](../README.md#quick-start)
  first (`docker compose up -d`, `bun install`, configure `.env`, `bun run db:push`,
  `bun run dev`). Verify it's up:

  ```bash
  curl http://localhost:3000/mdm/health
  # → {"status":"ok","version":"...","timestamp":"..."}
  ```

- A dashboard account: open http://localhost:3001/register and create one.
- JDK 17 and the Android SDK (or just [Android Studio](https://developer.android.com/studio)).
- The agent source:

  ```bash
  git clone https://github.com/azoila/openmdm-android.git
  cd openmdm-android
  ```

> **How enrollment authenticates — 30-second version.** The agent prefers
> *device-pinned-key* enrollment: it fetches a single-use challenge from the
> server, generates an ECDSA key in the device's hardware Keystore, and signs
> its enrollment request. This works against the demo server out of the box —
> no shared secret needs to match. The fallback path is an HMAC signature
> keyed with the agent's **compiled-in** `DEVICE_SECRET`, which must then
> equal the server's `MDM_DEVICE_SECRET`. Passing `-PdeviceSecret` at build
> time (shown below) makes both paths work.

---

## Path A — Emulator + ADB (no factory reset)

### 1. Start an emulator

Create/start any emulator with **API 26+ and no Google account signed in**
(a "Google APIs" or AOSP image is simplest — device-owner setup fails on a
device that has accounts).

```bash
emulator -avd <your_avd_name>
adb wait-for-device
```

### 2. Build and install the agent

The debug build's default server URL is `http://10.0.2.2:3000/mdm` —
`10.0.2.2` is how the emulator reaches your host machine, so it already
points at the demo server. Pass your server's enrollment secret so the HMAC
fallback also works:

```bash
./gradlew :agent:installDebug -PdeviceSecret="<MDM_DEVICE_SECRET from apps/server/.env>"
```

Expected output ends with:

```
BUILD SUCCESSFUL
```

> Running the server on a different port or a physical device on your LAN?
> Add `-PmdmServerUrl="http://<host>:<port>/mdm"`. Note the agent only
> allows cleartext HTTP to `10.0.2.2`, `localhost`, and `127.0.0.1` — for
> any other address use HTTPS or edit
> `agent/src/main/res/xml/network_security_config.xml`.

### 3. Make the agent Device Owner

```bash
adb shell dpm set-device-owner com.openmdm.agent/.receiver.MDMDeviceAdminReceiver
```

Expected output:

```
Success: Device owner set to package ComponentInfo{com.openmdm.agent/com.openmdm.agent.receiver.MDMDeviceAdminReceiver}
```

You'll see a **"Device admin enabled"** toast on the device.

| If you see… | It means… | Fix |
|---|---|---|
| `Not allowed to set the device owner because there are already some accounts on the device` | a Google/other account exists | remove all accounts in Settings, or wipe the emulator (`Device Manager → Wipe Data`) |
| `Not allowed to set the device owner because there are already several users` | secondary users exist | `adb shell pm list users`, remove extras, retry |
| `java.lang.IllegalStateException: Trying to set the device owner, but device owner is already set` | another DPC owns the device | wipe the emulator |

> Device Owner is what authorizes silent app installs, kiosk lock-task,
> reboot, and most policy enforcement. Enrollment itself works without it,
> but the device won't be able to execute most commands.

### 4. Enroll

Open the **OpenMDM Agent** app on the device. It boots into an enrollment
screen. Enter any device code (it becomes the device's enrollment reference —
e.g. `DEMO-001`) and tap **Enroll**.

What happens underneath: the agent calls `GET /mdm/agent/enroll/challenge`,
signs the canonical enrollment message with a Keystore-backed ECDSA key, and
`POST /mdm/agent/enroll` — the server verifies, pins the key, and (because
the demo sets `autoEnroll: true`) enrolls the device immediately and returns
a device token.

### 5. Verify — device online, policy applied

- **Dashboard**: http://localhost:3001/dashboard/devices — your device
  appears with status **Enrolled** within seconds, and starts heartbeating
  (battery, storage, network). Newly enrolled devices automatically receive
  the seeded **Default Policy** on their next config fetch.
- **Server log**: `[MDM] ...` enrollment events; the devices table row appears.
- **Device log**:

  ```bash
  adb logcat -s EnrollmentWorker MDMDeviceAdmin LauncherViewModel OpenMDM.HeartbeatWorker
  ```

- **Round-trip test** — send a command and watch it complete:

  From the dashboard: open the device → send **Sync**. Or via API:

  ```bash
  # device id from the dashboard URL or GET /mdm/devices
  curl -X POST http://localhost:3000/mdm/devices/<deviceId>/sync \
    -H "Cookie: <your dashboard session cookie>"
  ```

  The command shows `pending → sent → completed` in the device's command
  history. That's the full loop working: server → push/poll → agent →
  acknowledgment.

**Done.** You have a managed device. Try assigning the **Kiosk Mode** policy
or deploying an app from the dashboard next.

---

## Path B — Factory-Reset QR Provisioning (physical device)

This is the production flow: a wiped device scans one QR code, installs the
agent itself, becomes Device Owner, and auto-enrolls. It needs two things the
emulator path doesn't: a **hosted APK** and its **signing-certificate
checksum**.

> **Shortcut — use the prebuilt demo APK.** Every
> [openmdm-android release](https://github.com/azoila/openmdm-android/releases)
> ships a signed, generic agent APK, already hosted at a public HTTPS URL
> with a published checksum, so you can skip steps 1–3 entirely:
>
> ```
> apkUrl:   https://github.com/azoila/openmdm-android/releases/download/v0.4.0/openmdm-agent-v0.4.0.apk
> checksum: 9_sjHlnmSXCohJMV4nYtB5mppANaAuMBmUTuBM5OvIE
> ```
>
> (For newer releases, take both values from that release's
> `provisioning-checksum.txt`.) The demo APK has no compiled-in device
> secret, so it enrolls via the pinned-key path — which this demo server
> supports out of the box — and no TLS pin, so your MDM `serverUrl` must be
> HTTPS or a cleartext-allowed host. Jump to step 4.

### 1. Build a release-style APK

```bash
./gradlew :agent:assembleDebug \
  -PmdmServerUrl="http://<your-lan-ip>:3000/mdm" \
  -PdeviceSecret="<MDM_DEVICE_SECRET from apps/server/.env>"
```

The APK lands at `agent/build/outputs/apk/debug/agent-debug.apk`.

> A debug APK is fine for trying the flow (it's signed with your debug key,
> which is all the checksum pins). **Cleartext caveat**: the agent blocks
> plain HTTP except to `10.0.2.2`/`localhost` — for a physical device either
> serve the MDM over HTTPS, or add your LAN IP to
> `agent/src/main/res/xml/network_security_config.xml` before building.

### 2. Host the APK where the device can download it

Anything reachable from the device works. Quickest:

```bash
cd agent/build/outputs/apk/debug
python3 -m http.server 8080
# APK URL: http://<your-lan-ip>:8080/agent-debug.apk
```

### 3. Compute the signing-certificate checksum

Android verifies the downloaded DPC against the SHA-256 of its **signing
certificate**, URL-safe-base64-encoded. Use `apksigner` from the Android SDK
build-tools (the agent is signed with APK Signature Scheme v2+, which
`keytool -printcert -jarfile` cannot read):

```bash
BT="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)"
"$BT/apksigner" verify --print-certs agent-debug.apk \
  | awk '/certificate SHA-256 digest/ {print $NF; exit}' \
  | xxd -r -p | base64 | tr '+/' '-_' | tr -d '='
```

Expected output: a 43-character string like `BrRiUHX25-NB…` — that's your
`checksum`.

### 4. Generate the QR code from the dashboard

Sign in to the dashboard (http://localhost:3001) and open **Enrollment** in
the sidebar. On the *QR Provisioning* tab, fill in the server URL, APK URL,
and checksum, then scan the rendered QR (or click *Show JSON payload* to
inspect the raw provisioning JSON).

The page drives `GET /mdm/enrollment/qr` on the server; if you prefer, you
can still call it directly in a signed-in browser:

```
http://localhost:3000/mdm/enrollment/qr?format=svg
  &serverUrl=http://<your-lan-ip>:3000/mdm
  &apkUrl=http://<your-lan-ip>:8080/agent-debug.apk
  &checksum=<from step 3>
```

(one line, no spaces). Drop `format=svg` to get the raw JSON payload — it's
the standard Android provisioning format plus an `openmdm.*` extras bundle
carrying the server URL and enrollment secret.

> `serverUrl` and `apkUrl` must be reachable **from the device**, so use your
> machine's LAN IP, never `localhost`.

### 5. Provision the device

1. Factory-reset the device.
2. On the welcome screen, **tap the same spot 6 times** — the QR scanner
   launches (Android 7+).
3. Connect to Wi-Fi when prompted, scan the QR.
4. The device downloads the APK, verifies the checksum, installs the agent
   as Device Owner, and finishes setup.
5. On first network connectivity, the agent's `EnrollmentWorker` enrolls
   automatically using the provisioned server URL — no manual step.

### 6. Verify

Same as Path A step 5: the device appears **Enrolled** in the dashboard and
starts heartbeating. On the device, the agent app opens directly into the
launcher (not the enrollment screen), because provisioning already enrolled it.

---

## Enrollment states — what you should see, in order

| Stage | Where you see it | Signal |
|---|---|---|
| 1. Device Owner set | device toast / `dpm` output | `Device admin enabled`, `Success: Device owner set…` |
| 2. Provisioning complete (Path B) | `adb logcat -s MDMDeviceAdmin` | `Provisioned for <url>; scheduling enrollment` |
| 3. Enrollment attempted | `adb logcat -s EnrollmentWorker` | `Enrolled via provisioning against <url>` (or a retry message) |
| 4. Device registered | dashboard → Devices | row appears, status **Enrolled** |
| 5. Policy applied | dashboard → device detail | Default Policy shown; agent fetches it via `GET /mdm/agent/config` |
| 6. Ready / heartbeating | dashboard | battery/storage/network updating; `adb logcat -s OpenMDM.HeartbeatWorker` |

If the flow stalls, the stage that's missing tells you where to look.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Enrollment fails with **401 / Invalid enrollment signature** | HMAC fallback in use and the agent's compiled-in secret ≠ server's `MDM_DEVICE_SECRET` | rebuild with `-PdeviceSecret="<same value as server>"`; or check why the pinned-key path fell back (see next row) |
| Logcat shows `enrollment_pinned_key_unavailable` | challenge endpoint unreachable or returned 503 | 503 means the server's DB adapter has no challenge table — the demo wires it, so check you're on this demo's current schema (`bun run db:push`); network errors mean the server URL is wrong/unreachable |
| Enrollment fails with **401 timestamp** error | device clock skewed > 15 min from server | fix device time (the signed timestamp is checked for freshness to block replay) |
| **429 Too Many Requests** on enroll | enrollment endpoints are rate-limited (60 req/min/IP) | wait a minute; it's a security default, not a bug |
| Agent can't reach the server at all (`challenge_network_error`) | cleartext HTTP blocked, or wrong URL | HTTP is only allowed to `10.0.2.2`/`localhost`; use HTTPS or edit `network_security_config.xml`; from the emulator, the host is `10.0.2.2`, not `localhost` |
| QR scan does nothing / provisioning won't start | malformed payload, or QR generated for the wrong flow (an enrollment-URL QR is not a provisioning QR) | use this demo's `/mdm/enrollment/qr` endpoint — the payload must be the Android DPC JSON with `PROVISIONING_DEVICE_ADMIN_*` keys |
| Provisioning fails right after the APK downloads | signature checksum mismatch | recompute the checksum (step B.3) against the **exact APK** you hosted; rebuilding the APK changes nothing but re-signing does |
| `dpm set-device-owner` refuses | accounts or extra users on the device | see the table in Path A step 3 |
| Device enrolled but commands never complete | agent lacks Device Owner (Path A step 3 skipped) | set device owner, or factory-reset and use Path B |
| Device shows **Pending** in dashboard | server has `requireApproval` enabled | the demo uses `autoEnroll: true`; if you changed it, approve the device in the dashboard |

Still stuck? Capture logs and open an issue:

```bash
adb logcat -d -s MDMDeviceAdmin EnrollmentWorker ProvisioningMode PolicyCompliance LauncherViewModel > enrollment.log
```

---

## How it works under the hood

```
QR scan (factory reset)                    ADB path
        │                                      │
Android installs APK, sets Device Owner    dpm set-device-owner
        │                                      │
onProfileProvisioningComplete              user opens agent app,
  extras → ProvisioningStore                 enters device code
  (server URL, secret, token)                  │
        │                                      │
        └────────── EnrollmentWorker ──────────┘
                          │
        GET /mdm/agent/enroll/challenge        (single-use challenge)
        POST /mdm/agent/enroll                 (ECDSA-signed canonical message,
                          │                     public key pinned server-side;
                          │                     HMAC fallback if Keystore/challenge
                          │                     unavailable)
                          ▼
        server: autoEnroll → device created, device token issued
                          │
        GET /mdm/agent/config → Default Policy applied
        heartbeat loop → telemetry, pending commands, desired state
```

Key implementation references (in [openmdm-android](https://github.com/azoila/openmdm-android)):
`QREnrollmentParser`, `MDMDeviceAdminReceiver`, `EnrollmentWorker`,
`EnrollDeviceUseCase`, `EnrollmentScreen`. Server-side, the agent routes come
from `@openmdm/hono` and the enrollment logic from `@openmdm/core` — see
[`apps/server/src/mdm.ts`](../apps/server/src/mdm.ts) for how this demo
configures them.
