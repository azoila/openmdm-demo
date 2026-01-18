"use client";

import { useState } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Smartphone,
  Settings,
  Wifi,
  WifiOff,
  Camera,
  CameraOff,
  Bluetooth,
  Usb,
  Lock,
  MapPin,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  usePolicies,
  usePolicyDevices,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
} from "@/lib/mdm-hooks";
import type { Policy, PolicySettings } from "@/lib/mdm-types";
import { FormattedDateTime } from "@/components/ui/time-ago";
import { ConfirmDialog } from "./confirm-dialog";

const DEFAULT_SETTINGS: PolicySettings = {
  heartbeatInterval: 60,
  locationEnabled: false,
  locationReportInterval: 300,
  passwordPolicy: {
    required: false,
    minLength: 4,
    complexity: "numeric",
  },
  encryptionRequired: false,
  bluetooth: "user",
  wifi: "user",
  camera: "user",
  usb: "user",
};

export function PolicyManagement() {
  const { data: policies, isLoading } = usePolicies();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);

  const handleCreatePolicy = (data: { name: string; description: string; settings: PolicySettings }) => {
    createPolicy.mutate({
      name: data.name,
      description: data.description,
      isDefault: false,
      settings: data.settings,
    });
    setCreateDialogOpen(false);
  };

  const handleUpdatePolicy = (data: { name: string; description: string; settings: PolicySettings }) => {
    if (editingPolicy) {
      updatePolicy.mutate({
        id: editingPolicy.id,
        data: {
          name: data.name,
          description: data.description,
          settings: data.settings,
        },
      });
      setEditingPolicy(null);
    }
  };

  const handleDeletePolicy = () => {
    if (policyToDelete) {
      deletePolicy.mutate(policyToDelete.id);
      setPolicyToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policies</h1>
          <p className="text-muted-foreground">
            Manage device configuration policies
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Policy List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {policies?.map((policy) => (
          <Card key={policy.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={`h-5 w-5 ${policy.isDefault ? "text-primary" : "text-muted-foreground"}`} />
                  <CardTitle className="text-lg">{policy.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewingPolicy(policy)}>
                      <Settings className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingPolicy(policy)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {!policy.isDefault && (
                      <DropdownMenuItem
                        onClick={() => {
                          setPolicyToDelete(policy);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">
                {policy.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {policy.isDefault && (
                  <Badge variant="default">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Default
                  </Badge>
                )}
                {policy.settings?.kioskMode && (
                  <Badge variant="secondary">Kiosk</Badge>
                )}
                {policy.settings?.encryptionRequired && (
                  <Badge variant="outline">
                    <Lock className="mr-1 h-3 w-3" />
                    Encrypted
                  </Badge>
                )}
                {policy.settings?.locationEnabled && (
                  <Badge variant="outline">
                    <MapPin className="mr-1 h-3 w-3" />
                    GPS
                  </Badge>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <PolicyFeatureIcons settings={policy.settings} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <PolicyDialog
        open={createDialogOpen || !!editingPolicy}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingPolicy(null);
          }
        }}
        policy={editingPolicy}
        onSave={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
        isLoading={createPolicy.isPending || updatePolicy.isPending}
      />

      {/* View Details Dialog */}
      <PolicyDetailsDialog
        policy={viewingPolicy}
        open={!!viewingPolicy}
        onOpenChange={(open) => !open && setViewingPolicy(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Policy"
        description={`Are you sure you want to delete "${policyToDelete?.name}"? Devices using this policy will be assigned to the default policy.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeletePolicy}
      />
    </div>
  );
}

function PolicyFeatureIcons({ settings }: { settings: PolicySettings }) {
  const getIcon = (feature: string, value: string | undefined) => {
    const isEnabled = value === "on" || value === "user";
    const color = value === "on" ? "text-green-500" : value === "user" ? "text-yellow-500" : "text-red-500";

    switch (feature) {
      case "wifi":
        return isEnabled ? (
          <Wifi className={`h-4 w-4 ${color}`} />
        ) : (
          <WifiOff className={`h-4 w-4 ${color}`} />
        );
      case "camera":
        return isEnabled ? (
          <Camera className={`h-4 w-4 ${color}`} />
        ) : (
          <CameraOff className={`h-4 w-4 ${color}`} />
        );
      case "bluetooth":
        return <Bluetooth className={`h-4 w-4 ${color}`} />;
      case "usb":
        return <Usb className={`h-4 w-4 ${color}`} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon("wifi", settings?.wifi)}
      {getIcon("camera", settings?.camera)}
      {getIcon("bluetooth", settings?.bluetooth)}
      {getIcon("usb", settings?.usb)}
    </div>
  );
}

interface PolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
  onSave: (data: { name: string; description: string; settings: PolicySettings }) => void;
  isLoading: boolean;
}

function PolicyDialog({ open, onOpenChange, policy, onSave, isLoading }: PolicyDialogProps) {
  const [name, setName] = useState(policy?.name || "");
  const [description, setDescription] = useState(policy?.description || "");
  const [settings, setSettings] = useState<PolicySettings>(policy?.settings || DEFAULT_SETTINGS);

  // Reset form when dialog opens with new policy
  useState(() => {
    if (policy) {
      setName(policy.name);
      setDescription(policy.description || "");
      setSettings(policy.settings);
    } else {
      setName("");
      setDescription("");
      setSettings(DEFAULT_SETTINGS);
    }
  });

  const handleSubmit = () => {
    onSave({ name, description, settings });
  };

  const updateSetting = <K extends keyof PolicySettings>(key: K, value: PolicySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{policy ? "Edit Policy" : "Create Policy"}</DialogTitle>
          <DialogDescription>
            Configure device management settings for this policy.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="hardware">Hardware</TabsTrigger>
              <TabsTrigger value="kiosk">Kiosk</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter policy name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter policy description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartbeat">Heartbeat Interval (seconds)</Label>
                <Input
                  id="heartbeat"
                  type="number"
                  value={settings.heartbeatInterval || 60}
                  onChange={(e) => updateSetting("heartbeatInterval", parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="location"
                  checked={settings.locationEnabled}
                  onCheckedChange={(checked) => updateSetting("locationEnabled", !!checked)}
                />
                <Label htmlFor="location">Enable Location Tracking</Label>
              </div>
              {settings.locationEnabled && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="locationInterval">Location Report Interval (seconds)</Label>
                  <Input
                    id="locationInterval"
                    type="number"
                    value={settings.locationReportInterval || 300}
                    onChange={(e) => updateSetting("locationReportInterval", parseInt(e.target.value))}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="encryption"
                  checked={settings.encryptionRequired}
                  onCheckedChange={(checked) => updateSetting("encryptionRequired", !!checked)}
                />
                <Label htmlFor="encryption">Require Device Encryption</Label>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Password Policy</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passwordRequired"
                    checked={settings.passwordPolicy?.required}
                    onCheckedChange={(checked) =>
                      updateSetting("passwordPolicy", {
                        ...settings.passwordPolicy,
                        required: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="passwordRequired">Require Password</Label>
                </div>
                {settings.passwordPolicy?.required && (
                  <>
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        min={4}
                        max={16}
                        value={settings.passwordPolicy?.minLength || 4}
                        onChange={(e) =>
                          updateSetting("passwordPolicy", {
                            ...settings.passwordPolicy,
                            minLength: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="complexity">Complexity</Label>
                      <Select
                        value={settings.passwordPolicy?.complexity || "numeric"}
                        onValueChange={(value) =>
                          value && updateSetting("passwordPolicy", {
                            ...settings.passwordPolicy,
                            complexity: value as "numeric" | "alphabetic" | "alphanumeric" | "complex",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="numeric">Numeric (PIN)</SelectItem>
                          <SelectItem value="alphabetic">Alphabetic</SelectItem>
                          <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                          <SelectItem value="complex">Complex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="hardware" className="space-y-4 mt-4">
              {(["wifi", "bluetooth", "camera", "usb", "nfc", "microphone"] as const).map((feature) => (
                <div key={feature} className="space-y-2">
                  <Label htmlFor={feature} className="capitalize">
                    {feature}
                  </Label>
                  <Select
                    value={(settings as any)[feature] || "user"}
                    onValueChange={(value) => value && updateSetting(feature as keyof PolicySettings, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on">Always On</SelectItem>
                      <SelectItem value="off">Always Off</SelectItem>
                      <SelectItem value="user">User Controlled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="kiosk" className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kioskMode"
                  checked={settings.kioskMode}
                  onCheckedChange={(checked) => updateSetting("kioskMode", !!checked)}
                />
                <Label htmlFor="kioskMode">Enable Kiosk Mode</Label>
              </div>
              {settings.kioskMode && (
                <>
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="mainApp">Main Application Package</Label>
                    <Input
                      id="mainApp"
                      value={settings.mainApp || ""}
                      onChange={(e) => updateSetting("mainApp", e.target.value)}
                      placeholder="com.example.app"
                    />
                  </div>
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="kioskPassword">Exit Password</Label>
                    <Input
                      id="kioskPassword"
                      type="password"
                      value={settings.kioskExitPassword || ""}
                      onChange={(e) => updateSetting("kioskExitPassword", e.target.value)}
                      placeholder="Password to exit kiosk mode"
                    />
                  </div>
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lockStatusBar"
                        checked={settings.lockStatusBar}
                        onCheckedChange={(checked) => updateSetting("lockStatusBar", !!checked)}
                      />
                      <Label htmlFor="lockStatusBar">Lock Status Bar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lockNavBar"
                        checked={settings.lockNavigationBar}
                        onCheckedChange={(checked) => updateSetting("lockNavigationBar", !!checked)}
                      />
                      <Label htmlFor="lockNavBar">Lock Navigation Bar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blockInstall"
                        checked={settings.blockInstall}
                        onCheckedChange={(checked) => updateSetting("blockInstall", !!checked)}
                      />
                      <Label htmlFor="blockInstall">Block App Installation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blockUninstall"
                        checked={settings.blockUninstall}
                        onCheckedChange={(checked) => updateSetting("blockUninstall", !!checked)}
                      />
                      <Label htmlFor="blockUninstall">Block App Uninstallation</Label>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || isLoading}>
            {isLoading ? "Saving..." : policy ? "Update Policy" : "Create Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PolicyDetailsDialog({
  policy,
  open,
  onOpenChange,
}: {
  policy: Policy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: devices, isLoading } = usePolicyDevices(policy?.id || "");

  if (!policy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {policy.name}
          </DialogTitle>
          <DialogDescription>{policy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Policy Settings</h4>
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-xs overflow-auto max-h-48">
                {JSON.stringify(policy.settings, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">
              Assigned Devices ({devices?.length || 0})
            </h4>
            {isLoading ? (
              <Skeleton className="h-20" />
            ) : devices && devices.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">{device.name || device.model || device.id}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No devices assigned to this policy.</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Created: <FormattedDateTime date={policy.createdAt} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
