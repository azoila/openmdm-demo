"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  Upload,
  Smartphone,
  FolderTree,
  Shield,
  CheckCircle,
  Play,
  PowerOff,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useApplications,
  useRegisterApplication,
  useGroups,
  usePolicies,
  useDeployAppToDevice,
  useDeployAppToGroup,
  useDevices,
} from "@/lib/mdm-hooks";
import type { Application, Device, Group, Policy } from "@/lib/mdm-types";
import { ConfirmDialog } from "./confirm-dialog";

export function AppManagement() {
  const { data: apps, isLoading } = useApplications();
  const { data: devicesData } = useDevices();
  const { data: groups } = useGroups();
  const { data: policies } = usePolicies();
  const registerApp = useRegisterApplication();
  const deployToDevice = useDeployAppToDevice();
  const deployToGroup = useDeployAppToGroup();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewingApp, setViewingApp] = useState<Application | null>(null);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployingApp, setDeployingApp] = useState<Application | null>(null);

  const devices = devicesData || [];

  const handleRegisterApp = (data: Omit<Application, "id" | "createdAt" | "updatedAt" | "isActive">) => {
    registerApp.mutate(data);
    setCreateDialogOpen(false);
  };

  const handleOpenDeploy = (app: Application) => {
    setDeployingApp(app);
    setDeployDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            Manage and deploy applications to devices
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Register App
        </Button>
      </div>

      {/* App Grid */}
      {!apps || apps.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No applications registered</h3>
          <p className="text-muted-foreground mt-2">
            Register your first application to start deploying to devices.
          </p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Register App
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {app.packageName}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingApp(app)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenDeploy(app)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Deploy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">v{app.version}</Badge>
                  {app.isActive && (
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  )}
                  {app.isSystem && (
                    <Badge variant="secondary">System</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {app.runAtBoot && (
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      Run at boot
                    </div>
                  )}
                  {app.showIcon && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Show icon
                    </div>
                  )}
                </div>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDeploy(app)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Deploy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Register App Dialog */}
      <RegisterAppDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleRegisterApp}
        isLoading={registerApp.isPending}
      />

      {/* App Details Dialog */}
      <AppDetailsDialog
        app={viewingApp}
        open={!!viewingApp}
        onOpenChange={(open) => !open && setViewingApp(null)}
      />

      {/* Deploy Dialog */}
      <DeployDialog
        app={deployingApp}
        open={deployDialogOpen}
        onOpenChange={(open) => {
          setDeployDialogOpen(open);
          if (!open) setDeployingApp(null);
        }}
        devices={devices}
        groups={groups || []}
        policies={policies || []}
        onDeployToDevice={(deviceId) => {
          if (deployingApp) {
            deployToDevice.mutate({ packageName: deployingApp.packageName, deviceId });
          }
        }}
        onDeployToGroup={(groupId) => {
          if (deployingApp) {
            deployToGroup.mutate({ packageName: deployingApp.packageName, groupId });
            setDeployDialogOpen(false);
          }
        }}
        isLoading={deployToDevice.isPending || deployToGroup.isPending}
      />
    </div>
  );
}

interface RegisterAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Application, "id" | "createdAt" | "updatedAt" | "isActive">) => void;
  isLoading: boolean;
}

function RegisterAppDialog({ open, onOpenChange, onSave, isLoading }: RegisterAppDialogProps) {
  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [versionCode, setVersionCode] = useState(1);
  const [url, setUrl] = useState("");
  const [showIcon, setShowIcon] = useState(true);
  const [runAfterInstall, setRunAfterInstall] = useState(false);
  const [runAtBoot, setRunAtBoot] = useState(false);
  const [isSystem, setIsSystem] = useState(false);

  const handleSubmit = () => {
    onSave({
      name,
      packageName,
      version,
      versionCode,
      url: url || null,
      hash: null,
      showIcon,
      runAfterInstall,
      runAtBoot,
      isSystem,
      metadata: {
        autoGrantPermissions: true,
        whitelistBattery: true,
      },
    });
    // Reset form
    setName("");
    setPackageName("");
    setVersion("1.0.0");
    setVersionCode(1);
    setUrl("");
    setShowIcon(true);
    setRunAfterInstall(false);
    setRunAtBoot(false);
    setIsSystem(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register Application</DialogTitle>
          <DialogDescription>
            Add a new application to the MDM system for deployment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packageName">Package Name</Label>
            <Input
              id="packageName"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="com.example.myapp"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="versionCode">Version Code</Label>
              <Input
                id="versionCode"
                type="number"
                value={versionCode}
                onChange={(e) => setVersionCode(parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">APK URL (optional)</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://storage.example.com/app.apk"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base">Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showIcon"
                  checked={showIcon}
                  onCheckedChange={(checked) => setShowIcon(!!checked)}
                />
                <Label htmlFor="showIcon">Show app icon in launcher</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="runAfterInstall"
                  checked={runAfterInstall}
                  onCheckedChange={(checked) => setRunAfterInstall(!!checked)}
                />
                <Label htmlFor="runAfterInstall">Run after installation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="runAtBoot"
                  checked={runAtBoot}
                  onCheckedChange={(checked) => setRunAtBoot(!!checked)}
                />
                <Label htmlFor="runAtBoot">Run at device boot</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSystem"
                  checked={isSystem}
                  onCheckedChange={(checked) => setIsSystem(!!checked)}
                />
                <Label htmlFor="isSystem">System application</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !packageName || isLoading}>
            {isLoading ? "Registering..." : "Register App"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppDetailsDialog({
  app,
  open,
  onOpenChange,
}: {
  app: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {app.name}
          </DialogTitle>
          <DialogDescription className="font-mono">{app.packageName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Version</span>
              <p className="font-medium">{app.version}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Version Code</span>
              <p className="font-medium">{app.versionCode}</p>
            </div>
          </div>

          {app.url && (
            <div>
              <span className="text-sm text-muted-foreground">APK URL</span>
              <p className="font-mono text-xs break-all">{app.url}</p>
            </div>
          )}

          {app.hash && (
            <div>
              <span className="text-sm text-muted-foreground">Hash</span>
              <p className="font-mono text-xs break-all">{app.hash}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {app.isActive && <Badge variant="default" className="bg-green-500">Active</Badge>}
            {app.isSystem && <Badge variant="secondary">System App</Badge>}
            {app.showIcon && <Badge variant="outline">Show Icon</Badge>}
            {app.runAtBoot && <Badge variant="outline">Run at Boot</Badge>}
            {app.runAfterInstall && <Badge variant="outline">Run After Install</Badge>}
          </div>

          {app.metadata && (
            <div>
              <span className="text-sm text-muted-foreground">Metadata</span>
              <div className="bg-muted rounded p-2 mt-1">
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(app.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DeployDialogProps {
  app: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: Device[];
  groups: Group[];
  policies: Policy[];
  onDeployToDevice: (deviceId: string) => void;
  onDeployToGroup: (groupId: string) => void;
  isLoading: boolean;
}

function DeployDialog({
  app,
  open,
  onOpenChange,
  devices,
  groups,
  policies,
  onDeployToDevice,
  onDeployToGroup,
  isLoading,
}: DeployDialogProps) {
  const [deployTarget, setDeployTarget] = useState<"device" | "group">("device");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  if (!app) return null;

  const handleDeploy = () => {
    if (deployTarget === "device" && selectedDevice) {
      onDeployToDevice(selectedDevice);
    } else if (deployTarget === "group" && selectedGroup) {
      onDeployToGroup(selectedGroup);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Deploy {app.name}
          </DialogTitle>
          <DialogDescription>
            Choose where to deploy this application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Deploy To</Label>
            <Select value={deployTarget} onValueChange={(v) => v && setDeployTarget(v as "device" | "group")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="device">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Single Device
                  </div>
                </SelectItem>
                <SelectItem value="group">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4" />
                    Device Group
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {deployTarget === "device" && (
            <div className="space-y-2">
              <Label>Select Device</Label>
              <Select value={selectedDevice} onValueChange={(v) => setSelectedDevice(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices
                    .filter((d) => d.status === "enrolled")
                    .map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name || device.model || device.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {deployTarget === "group" && (
            <div className="space-y-2">
              <Label>Select Group</Label>
              <Select value={selectedGroup} onValueChange={(v) => setSelectedGroup(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={
              isLoading ||
              (deployTarget === "device" && !selectedDevice) ||
              (deployTarget === "group" && !selectedGroup)
            }
          >
            {isLoading ? "Deploying..." : "Deploy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
