"use client";

import { useState } from "react";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Smartphone,
  Shield,
  RefreshCw,
  Users,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGroups,
  useGroupDevices,
  usePolicies,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useSyncGroup,
} from "@/lib/mdm-hooks";
import type { Group, Policy, Device } from "@/lib/mdm-types";
import { ConfirmDialog } from "./confirm-dialog";

export function GroupManagement() {
  const { data: groups, isLoading } = useGroups();
  const { data: policies } = usePolicies();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const syncGroup = useSyncGroup();

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const handleCreateGroup = (data: { name: string; description: string; policyId: string | null }) => {
    createGroup.mutate({
      name: data.name,
      description: data.description,
      policyId: data.policyId,
      parentId: null,
      metadata: null,
    });
    setCreateDialogOpen(false);
  };

  const handleUpdateGroup = (data: { name: string; description: string; policyId: string | null }) => {
    if (editingGroup) {
      updateGroup.mutate({
        id: editingGroup.id,
        data: {
          name: data.name,
          description: data.description,
          policyId: data.policyId,
        },
      });
      setEditingGroup(null);
    }
  };

  const handleDeleteGroup = () => {
    if (groupToDelete) {
      deleteGroup.mutate(groupToDelete.id);
      setGroupToDelete(null);
    }
  };

  const handleSyncGroup = (id: string) => {
    syncGroup.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16" />
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
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Organize devices into logical groups
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Group Grid */}
      {!groups || groups.length === 0 ? (
        <Card className="p-8 text-center">
          <FolderTree className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No groups created</h3>
          <p className="text-muted-foreground mt-2">
            Create your first group to organize devices.
          </p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              policies={policies || []}
              onView={() => setViewingGroup(group)}
              onEdit={() => setEditingGroup(group)}
              onDelete={() => {
                setGroupToDelete(group);
                setDeleteDialogOpen(true);
              }}
              onSync={() => handleSyncGroup(group.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <GroupDialog
        open={createDialogOpen || !!editingGroup}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingGroup(null);
          }
        }}
        group={editingGroup}
        policies={policies || []}
        onSave={editingGroup ? handleUpdateGroup : handleCreateGroup}
        isLoading={createGroup.isPending || updateGroup.isPending}
      />

      {/* View Details Dialog */}
      <GroupDetailsDialog
        group={viewingGroup}
        open={!!viewingGroup}
        onOpenChange={(open) => !open && setViewingGroup(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Group"
        description={`Are you sure you want to delete "${groupToDelete?.name}"? Devices in this group will not be deleted.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteGroup}
      />
    </div>
  );
}

interface GroupCardProps {
  group: Group;
  policies: Policy[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
}

function GroupCard({ group, policies, onView, onEdit, onDelete, onSync }: GroupCardProps) {
  const { data: devices } = useGroupDevices(group.id);
  const policy = policies.find((p) => p.id === group.policyId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{group.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Users className="mr-2 h-4 w-4" />
                View Devices
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSync}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync All Devices
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">
          {group.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{devices?.length || 0} devices</span>
          </div>
          {policy && (
            <Badge variant="outline" className="text-xs">
              <Shield className="mr-1 h-3 w-3" />
              {policy.name}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  policies: Policy[];
  onSave: (data: { name: string; description: string; policyId: string | null }) => void;
  isLoading: boolean;
}

function GroupDialog({ open, onOpenChange, group, policies, onSave, isLoading }: GroupDialogProps) {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [policyId, setPolicyId] = useState<string>(group?.policyId || "");

  // Reset form when dialog opens with new group
  useState(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
      setPolicyId(group.policyId || "");
    } else {
      setName("");
      setDescription("");
      setPolicyId("");
    }
  });

  const handleSubmit = () => {
    onSave({ name, description, policyId: policyId || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{group ? "Edit Group" : "Create Group"}</DialogTitle>
          <DialogDescription>
            {group
              ? "Update group settings and policy assignment."
              : "Create a new group to organize your devices."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy">Default Policy (optional)</Label>
            <Select value={policyId} onValueChange={(v) => setPolicyId(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No policy</SelectItem>
                {policies.map((policy) => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {policy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Devices added to this group will automatically use this policy.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || isLoading}>
            {isLoading ? "Saving..." : group ? "Update Group" : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupDetailsDialog({
  group,
  open,
  onOpenChange,
}: {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: devices, isLoading } = useGroupDevices(group?.id || "");

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            {group.name}
          </DialogTitle>
          <DialogDescription>{group.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">
              Devices ({devices?.length || 0})
            </h4>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : devices && devices.length > 0 ? (
              <div className="rounded-md border max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>OS Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <span>{device.name || device.model || device.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              device.status === "enrolled"
                                ? "default"
                                : device.status === "blocked"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {device.status}
                          </Badge>
                        </TableCell>
                        <TableCell>Android {device.osVersion || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No devices in this group.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
