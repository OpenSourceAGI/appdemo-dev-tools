/**
 * Memory and disk-related system information functions
 * @module info/memory
 */

import os from "os";
import fs from "fs";
import type { InfoContext } from "../types/internal-types";
import { IS_LINUX } from "../utils/platform";
import { execCommand } from "../utils/command";
import { getCachedValue, setCachedValue } from "../cache/cache";

/**
 * Gets memory usage in gigabytes
 * Reads from /proc/meminfo on Linux, falls back to os.totalmem()
 * @param context - Info context with cache
 * @returns Memory usage as "used/total GB"
 * @example "12/32GB", "6/16GB"
 */
export function ram_used(context: InfoContext): string {
  const cached = getCachedValue(context.cache, "ram_used");
  if (cached) return cached;

  if (IS_LINUX) {
    try {
      const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
      const totalMatch = meminfo.match(/MemTotal:\s+(\d+) kB/);
      const freeMatch = meminfo.match(/MemFree:\s+(\d+) kB/);

      if (totalMatch && freeMatch) {
        const totalMB = Math.round(parseInt(totalMatch[1]) / 1024);
        const freeMB = Math.round(parseInt(freeMatch[1]) / 1024);
        const usedMB = totalMB - freeMB;

        const totalGB = Math.round(totalMB / 1024);
        const usedGB = Math.round(usedMB / 1024);

        const result = `${usedGB}/${totalGB}GB`;
        setCachedValue(context.cache, "ram_used", result);
        return result;
      }
    } catch {}
  }

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const totalGB = Math.round(totalMem / (1024 * 1024 * 1024));
  const usedGB = Math.round(usedMem / (1024 * 1024 * 1024));

  const result = `${usedGB}/${totalGB}GB`;
  setCachedValue(context.cache, "ram_used", result);
  return result;
}

/**
 * Gets available memory in gigabytes
 * Reads MemAvailable from /proc/meminfo (Linux only)
 * @returns Available memory with "GB available" suffix or empty string
 * @example "12GB available", "4GB available"
 */
export function memory_available(): string {
  if (!IS_LINUX) return "";

  try {
    const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
    const availableMatch = meminfo.match(/MemAvailable:\s+(\d+) kB/);
    if (availableMatch) {
      const availableGB = Math.round(parseInt(availableMatch[1]) / 1024 / 1024);
      return `${availableGB}GB available`;
    }
  } catch {}
  return "";
}

/**
 * Gets swap memory usage
 * Calculates swap usage from /proc/meminfo (Linux only)
 * @returns Swap usage as "percentage (size MB) swap" or empty string
 * @example "15% (512MB) swap", "0% (0MB) swap"
 */
export function swap_used(): string {
  if (!IS_LINUX) return "";

  try {
    const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
    const swapTotalMatch = meminfo.match(/SwapTotal:\s+(\d+) kB/);
    const swapFreeMatch = meminfo.match(/SwapFree:\s+(\d+) kB/);

    if (swapTotalMatch && swapFreeMatch) {
      const swapTotal = parseInt(swapTotalMatch[1]);
      const swapFree = parseInt(swapFreeMatch[1]);
      const swapUsed = swapTotal - swapFree;

      if (swapTotal > 0) {
        const swapUsedPercent = Math.round((swapUsed / swapTotal) * 100);
        const swapUsedMB = Math.round(swapUsed / 1024);
        return `${swapUsedPercent}% (${swapUsedMB}MB) swap`;
      }
    }
  } catch {}
  return "";
}

/**
 * Gets root filesystem disk usage percentage
 * Uses df command on Linux/Android
 * @param context - Info context with cache
 * @returns Percentage string or empty string
 * @example "45%", "78%"
 */
export function disk_used(context: InfoContext): string {
  const cached = getCachedValue(context.cache, "disk_used");
  if (cached !== null) return cached;

  if (IS_LINUX) {
    try {
      const df = execCommand("df -h");
      let diskUsage = "";

      if (df.includes("/storage/emulated")) {
        const match = df.match(/\s+(\d+%)\s+\/storage\/emulated/);
        diskUsage = match ? match[1] : "";
      } else {
        const lines = df.split("\n");
        for (const line of lines) {
          if (line.trim().endsWith(" /")) {
            const parts = line.trim().split(/\s+/);
            const percentIndex = parts.findIndex((part) => part.includes("%"));
            if (percentIndex !== -1) {
              diskUsage = parts[percentIndex];
              break;
            }
          }
        }

        if (!diskUsage) {
          const rootMatch = df.match(/(\d+%)\s+\/\s*$/m);
          diskUsage = rootMatch ? rootMatch[1] : "";
        }
      }

      setCachedValue(context.cache, "disk_used", diskUsage);
      return diskUsage;
    } catch {}
  }

  setCachedValue(context.cache, "disk_used", "");
  return "";
}

/**
 * Gets system load averages
 * Reads 1, 5, and 15 minute load averages from /proc/loadavg (Linux only)
 * @returns Space-separated load averages (1m 5m 15m) or empty string
 * @example "0.52 0.58 0.59", "2.10 1.95 1.88"
 */
export function load_average(): string {
  if (!IS_LINUX) return "";

  try {
    const loadavg = fs.readFileSync("/proc/loadavg", "utf8");
    const loads = loadavg.split(" ").slice(0, 3);
    return loads.join(" ");
  } catch {}
  return "";
}

/**
 * Gets mounted filesystem information
 * Lists non-system mount points with usage from df (Linux only)
 * Excludes /, /dev, /proc, and /sys mounts
 * @param context - Info context with cache
 * @returns Space-separated mount points with usage or empty string
 * @example "/home(45%) /mnt/data(78%)", "/media/usb(12%)"
 */
export function mount_points(context: InfoContext): string {
  const cached = getCachedValue(context.cache, "mount_points");
  if (cached !== null) return cached;

  if (!IS_LINUX) {
    setCachedValue(context.cache, "mount_points", "");
    return "";
  }

  try {
    const df = execCommand("df -h");
    const lines = df.split("\n").slice(1);
    const mountPoints: string[] = [];

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) {
        const mountPoint = parts[5];
        const usage = parts[4];
        if (
          !mountPoint.startsWith("/dev") &&
          !mountPoint.startsWith("/proc") &&
          !mountPoint.startsWith("/sys") &&
          mountPoint !== "/"
        ) {
          mountPoints.push(`${mountPoint}(${usage})`);
        }
      }
    });

    const result = mountPoints.slice(0, 3).join(" ");
    setCachedValue(context.cache, "mount_points", result);
    return result;
  } catch {}

  setCachedValue(context.cache, "mount_points", "");
  return "";
}
