"use client";

import {
  Activity,
  Smartphone,
  Shield,
  Package,
  Power,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/lib/mdm-types";
import { TimeAgo } from "@/components/ui/time-ago";

interface RecentEventsProps {
  events: Event[] | undefined;
  isLoading: boolean;
}

function getEventIcon(type: string) {
  switch (type) {
    case "device.enrolled":
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case "device.unenrolled":
      return <UserMinus className="h-4 w-4 text-red-500" />;
    case "device.heartbeat":
      return <Activity className="h-4 w-4 text-blue-500" />;
    case "device.sync":
      return <RefreshCw className="h-4 w-4 text-blue-500" />;
    case "device.reboot":
      return <Power className="h-4 w-4 text-orange-500" />;
    case "device.lock":
      return <Lock className="h-4 w-4 text-yellow-500" />;
    case "device.blocked":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "policy.applied":
      return <Shield className="h-4 w-4 text-purple-500" />;
    case "app.installed":
      return <Package className="h-4 w-4 text-green-500" />;
    case "app.uninstalled":
      return <Package className="h-4 w-4 text-red-500" />;
    case "command.completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "command.failed":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Smartphone className="h-4 w-4 text-muted-foreground" />;
  }
}

function getEventDescription(event: Event): string {
  const data = event.data as Record<string, unknown> | null;

  switch (event.type) {
    case "device.enrolled":
      return `Device enrolled: ${data?.model || data?.serial || "Unknown"}`;
    case "device.unenrolled":
      return "Device unenrolled";
    case "device.heartbeat":
      return "Heartbeat received";
    case "device.sync":
      return "Device synced";
    case "device.reboot":
      return "Reboot command sent";
    case "device.lock":
      return "Lock command sent";
    case "device.blocked":
      return `Device blocked: ${data?.reason || "No reason provided"}`;
    case "policy.applied":
      return `Policy applied: ${data?.policyName || "Unknown"}`;
    case "app.installed":
      return `App installed: ${data?.packageName || "Unknown"}`;
    case "app.uninstalled":
      return `App uninstalled: ${data?.packageName || "Unknown"}`;
    case "command.completed":
      return `Command completed: ${data?.type || "Unknown"}`;
    case "command.failed":
      return `Command failed: ${data?.type || "Unknown"} - ${data?.error || ""}`;
    default:
      return event.type;
  }
}

export function RecentEvents({ events, isLoading }: RecentEventsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {!events || events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-muted p-2">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getEventDescription(event)}
                    </p>
                    <TimeAgo
                      date={event.createdAt}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
