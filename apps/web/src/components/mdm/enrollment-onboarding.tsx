"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { mdmApi, mdmEnrollment, type EnrollmentQrOptions } from "@/lib/mdm-api";
import type { Policy, Group } from "@/lib/mdm-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Info, QrCode, RefreshCw, Smartphone } from "lucide-react";

const NONE = "none";

function Step({ number, title, children }: {
  number: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {number}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {children && (
          <div className="text-sm text-muted-foreground">{children}</div>
        )}
      </div>
    </li>
  );
}

function Callout({ variant, children }: {
  variant: "info" | "warning";
  children: React.ReactNode;
}) {
  const Icon = variant === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={
        variant === "warning"
          ? "flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"
          : "flex items-start gap-2 rounded-xl border bg-muted/50 p-3 text-sm text-muted-foreground"
      }
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function EnrollmentOnboarding() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // QR form state
  const [serverUrl, setServerUrl] = useState(mdmEnrollment.defaultServerUrl);
  const [apkUrl, setApkUrl] = useState("");
  const [checksum, setChecksum] = useState("");
  const [policyId, setPolicyId] = useState(NONE);
  const [groupId, setGroupId] = useState(NONE);

  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([mdmApi.policies.list(), mdmApi.groups.list()])
      .then(([p, g]) => {
        setPolicies(p);
        setGroups(g);
      })
      .catch(() => {
        // Selectors stay empty; QR generation works without them.
      });
  }, []);

  const buildOptions = useCallback((): EnrollmentQrOptions => {
    return {
      serverUrl: serverUrl.trim() || undefined,
      apkUrl: apkUrl.trim() || undefined,
      checksum: checksum.trim() || undefined,
      policyId: policyId === NONE ? undefined : policyId,
      groupId: groupId === NONE ? undefined : groupId,
    };
  }, [serverUrl, apkUrl, checksum, policyId, groupId]);

  const generate = useCallback(async () => {
    setLoading(true);
    setPayload(null);
    try {
      const svg = await mdmEnrollment.qrSvg(buildOptions());
      setQrSvg(svg);
    } catch (error) {
      setQrSvg(null);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate QR code"
      );
    } finally {
      setLoading(false);
    }
  }, [buildOptions]);

  const showPayload = useCallback(async () => {
    try {
      const json = await mdmEnrollment.qrPayload(buildOptions());
      setPayload(JSON.stringify(json, null, 2));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch payload"
      );
    }
  }, [buildOptions]);

  // Generate once on mount with the defaults.
  useEffect(() => {
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tabs defaultValue="qr">
      <TabsList>
        <TabsTrigger value="qr">
          <QrCode className="mr-2 h-4 w-4" />
          QR Provisioning
        </TabsTrigger>
        <TabsTrigger value="manual">
          <Smartphone className="mr-2 h-4 w-4" />
          Manual Enrollment
        </TabsTrigger>
      </TabsList>

      <TabsContent value="qr" className="mt-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Provisioning QR</CardTitle>
              <CardDescription>
                Scan on a factory-reset device to install the agent, set it as
                Device Owner, and enroll it against this server automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-server-url">Server URL</Label>
                <Input
                  id="qr-server-url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://192.168.1.10:3000/mdm"
                />
                <p className="text-xs text-muted-foreground">
                  Must be reachable <strong>from the device</strong>. localhost
                  only works for emulators (as http://10.0.2.2:3000/mdm) — use
                  this machine&apos;s LAN address for physical devices.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-apk-url">Agent APK URL (optional)</Label>
                <Input
                  id="qr-apk-url"
                  value={apkUrl}
                  onChange={(e) => setApkUrl(e.target.value)}
                  placeholder="https://…/openmdm-agent.apk"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-checksum">
                  APK signature checksum (required with APK URL)
                </Label>
                <Input
                  id="qr-checksum"
                  value={checksum}
                  onChange={(e) => setChecksum(e.target.value)}
                  placeholder="URL-safe base64 SHA-256 of the signing cert"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Initial policy</Label>
                  <Select value={policyId} onValueChange={(v) => setPolicyId(v || NONE)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {policyId === NONE
                          ? "Default policy"
                          : policies.find((p) => p.id === policyId)?.name ?? policyId}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Default policy</SelectItem>
                      {policies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Initial group</Label>
                  <Select value={groupId} onValueChange={(v) => setGroupId(v || NONE)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {groupId === NONE
                          ? "Unassigned"
                          : groups.find((g) => g.id === groupId)?.name ?? groupId}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Unassigned</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={generate} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {loading ? "Generating…" : "Regenerate QR"}
                </Button>
                <Button variant="outline" onClick={showPayload}>
                  Show JSON payload
                </Button>
              </div>

              <Callout variant="warning">
                The payload embeds this server&apos;s enrollment secret
                (MDM_DEVICE_SECRET). Treat the QR and JSON as sensitive — don&apos;t
                post screenshots of them.
              </Callout>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                {loading ? (
                  <Skeleton className="h-64 w-64 rounded-xl" />
                ) : qrSvg ? (
                  <div
                    className="w-64 max-w-full rounded-xl bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
                    // Trusted content: SVG rendered by this deployment's own server.
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <p className="p-8 text-sm text-muted-foreground">
                    QR unavailable — check the fields and regenerate.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How to provision</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <Step number={1} title="Factory-reset the device">
                    Or start with a brand-new one — QR provisioning only runs
                    during initial device setup.
                  </Step>
                  <Step number={2} title="Tap the welcome screen 6 times">
                    The setup wizard opens the QR scanner.
                  </Step>
                  <Step number={3} title="Connect to Wi-Fi and scan this QR">
                    Android downloads the agent APK (when an APK URL is set),
                    verifies the checksum, and sets the agent as Device Owner.
                  </Step>
                  <Step number={4} title="Wait for auto-enrollment">
                    The agent enrolls itself in the background and the device
                    appears under Devices.
                  </Step>
                </ol>
              </CardContent>
            </Card>

            {payload && (
              <Card>
                <CardHeader>
                  <CardTitle>Provisioning payload</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-80 overflow-auto rounded-xl bg-muted p-4 text-xs">
                    {payload}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="manual" className="mt-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Enroll a device with the agent installed</CardTitle>
              <CardDescription>
                For devices that already have the OpenMDM Agent — no factory
                reset required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <Step number={1} title="Install the OpenMDM Agent">
                  Sideload the APK (<code>adb install</code>) or download it on
                  the device.
                </Step>
                <Step number={2} title="Make sure the agent points at this server">
                  Development builds default to{" "}
                  <code>http://10.0.2.2:3000/mdm</code>, which reaches this
                  machine from an Android emulator. For a physical device,
                  build the agent with <code>MDM_SERVER_URL</code> set to a
                  LAN-reachable address — or use QR provisioning, which
                  delivers the URL in the payload.
                </Step>
                <Step number={3} title="Open the agent and enter a device code">
                  Any code you like, e.g. <code>STORE-042</code>. Uppercase
                  letters and digits.
                </Step>
                <Step number={4} title="Done">
                  The device enrolls immediately and appears under Devices.
                </Step>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What is the device code?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The device code is a <strong>pairing reference stored on the
                device</strong>, used by companion apps (like the MidiaMob
                Player) for activation. It is not a credential: the server
                identifies devices by their hardware identifiers and
                authenticates enrollment cryptographically, so there is nothing
                to pre-register here in the dashboard.
              </p>
              <p>
                Pick any convention that helps you recognize devices in the
                field — store number, asset tag, or installer initials.
              </p>
              <Callout variant="info">
                Enrollment is authenticated with a device-bound key
                (Android Keystore) and a one-time server challenge. Older
                servers without challenge support fall back to a shared-secret
                signature, which requires the agent build&apos;s device secret to
                match this server&apos;s <code>MDM_DEVICE_SECRET</code>.
              </Callout>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}