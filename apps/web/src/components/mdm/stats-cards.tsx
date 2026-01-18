"use client";

import {
  Smartphone,
  CheckCircle,
  Clock,
  Ban,
  Wifi,
  WifiOff,
  Battery,
  Activity,
  Shield,
  Package,
  FolderTree,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/mdm-types";

interface StatsCardsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: "Total Devices",
      value: stats.devices.total,
      description: `${stats.devices.enrolled} enrolled`,
      icon: Smartphone,
      color: "text-blue-500",
    },
    {
      title: "Online",
      value: stats.devices.online,
      description: `${stats.devices.offline} offline`,
      icon: Wifi,
      color: "text-green-500",
    },
    {
      title: "Pending",
      value: stats.devices.pending,
      description: "Awaiting enrollment",
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Blocked",
      value: stats.devices.blocked,
      description: "Access denied",
      icon: Ban,
      color: "text-red-500",
    },
    {
      title: "Low Battery",
      value: stats.devices.lowBattery,
      description: "Below 20%",
      icon: Battery,
      color: "text-orange-500",
    },
    {
      title: "Commands (24h)",
      value: stats.commands.last24h.total,
      description: `${stats.commands.last24h.successRate}% success rate`,
      icon: Activity,
      color: "text-purple-500",
    },
    {
      title: "Policies",
      value: stats.policies.total,
      description: `${stats.policies.active} active`,
      icon: Shield,
      color: "text-indigo-500",
    },
    {
      title: "Applications",
      value: stats.applications.total,
      description: `${stats.applications.active} active`,
      icon: Package,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface CommandStatsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export function CommandStats({ stats, isLoading }: CommandStatsProps) {
  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { commands } = stats;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Command Activity (Last 24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-500">{commands.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{commands.last24h.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{commands.last24h.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{commands.last24h.failed}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {commands.last24h.successRate >= 90 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : commands.last24h.successRate >= 70 ? (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {commands.last24h.successRate}% Success Rate
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
