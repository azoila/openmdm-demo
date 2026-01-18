"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "@/lib/format";

interface TimeAgoProps {
  date: Date | string | null;
  className?: string;
  fallback?: string;
}

/**
 * Client-only component for displaying relative time.
 * Prevents hydration mismatch by only computing time on the client.
 */
export function TimeAgo({ date, className, fallback = "-" }: TimeAgoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!date) {
    return <span className={className}>{fallback}</span>;
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // During SSR and initial hydration, show a placeholder
  if (!mounted) {
    return (
      <span className={className} suppressHydrationWarning>
        ...
      </span>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {formatDistanceToNow(dateObj)}
    </span>
  );
}

interface FormattedDateTimeProps {
  date: Date | string | null;
  className?: string;
  fallback?: string;
}

/**
 * Client-only component for displaying formatted date/time.
 * Prevents hydration mismatch from locale differences.
 */
export function FormattedDateTime({ date, className, fallback = "-" }: FormattedDateTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!date) {
    return <span className={className}>{fallback}</span>;
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // During SSR and initial hydration, show ISO format (deterministic)
  if (!mounted) {
    return (
      <span className={className} suppressHydrationWarning>
        {dateObj.toISOString().slice(0, 16).replace("T", " ")}
      </span>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {dateObj.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}
