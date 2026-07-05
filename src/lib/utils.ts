import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compares a date string (e.g. an appointment's UTC timestamp) against a reference date
 * using the browser's local calendar day, not raw string/UTC-date matching. A UTC timestamp
 * like "2026-07-05T22:00:00Z" can already be "tomorrow" in a local timezone ahead of UTC, so
 * comparing calendar dates in local time (as both the user and the clinic actually experience
 * them) avoids the off-by-one-day bugs that string-prefix comparisons against UTC produce.
 */
export function isSameLocalDay(dateStr: string, reference: Date = new Date()): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}
