/**
 * @fileoverview System Information API
 *
 * A comprehensive cross-platform system information collection API.
 * Provides clean JSON data without formatting, suitable for programmatic use.
 *
 * @module system-info-api
 * @author vtempest
 * @license rights.institute/prosper
 *
 * @example
 * ```typescript
 * import { getSystemInfo } from 'about-system';
 *
 * const info = await getSystemInfo();
 * console.log(info.cpu);        // "AMD Ryzen 9 5900HX"
 * console.log(info.ram_used);   // "8/16GB"
 * console.log(info.platform);   // "linux"
 * ```
 */

import os from "os";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import https from "https";
import type { SystemInfo, SystemInfoOptions } from "./systeminfo-types.js";

/**
 * Cache file location in system's temporary directory
 * @constant
 */
const CACHE_FILE = path.join(os.tmpdir(), "systeminfo-cache.json");

/**
 * Cache duration configuration for different system information types
 * Values are in milliseconds
 *
 * @constant
 * @property {number} ip - IP information cache (5 minutes)
 * @property {number} cpu - CPU information cache (24 hours)
 * @property {number} gpu - GPU information cache (24 hours)
 * @property {number} os - OS information cache (24 hours)
 * @property {number} device - Device information cache (24 hours)
 * @property {number} kernel - Kernel information cache (1 hour)
 * @property {number} pacman - Package managers cache (10 minutes)
 * @property {number} ports - Open ports cache (5 minutes)
 * @property {number} containers - Docker containers cache (5 minutes)
 * @property {number} top_process - Top process cache (5 seconds)
 * @property {number} disk_used - Disk usage cache (1 minute)
 * @property {number} ram_used - RAM usage cache (10 seconds)
 * @property {number} services_running - Services cache (5 minutes)
 * @property {number} temperature - Temperature cache (30 seconds)
 * @property {number} battery - Battery status cache (1 minute)
 * @property {number} network_interfaces - Network interfaces cache (5 minutes)
 * @property {number} mount_points - Mount points cache (10 minutes)
 */
const CACHE_DURATION = {
  ip: 5 * 60 * 1000,
  cpu: 24 * 60 * 60 * 1000,
  gpu: 24 * 60 * 60 * 1000,
  os: 24 * 60 * 60 * 1000,
  device: 24 * 60 * 60 * 1000,
  kernel: 60 * 60 * 1000,
  pacman: 10 * 60 * 1000,
  ports: 5 * 60 * 1000,
  containers: 5 * 60 * 1000,
  top_process: 5 * 1000,
  disk_used: 60 * 1000,
  ram_used: 10 * 1000,
  services_running: 5 * 60 * 1000,
  temperature: 30 * 1000,
  battery: 60 * 1000,
  network_interfaces: 5 * 60 * 1000,
  mount_points: 10 * 60 * 1000,
};

/**
 * Platform detection constants
 */
const IS_WINDOWS = os.platform() === "win32";
const IS_MAC = os.platform() === "darwin";
const IS_LINUX = os.platform() === "linux";

/**
 * Default IPInfo.io API token for geolocation
 * @constant
 */
const DEFAULT_IPINFO_TOKEN = "da2d6cc4baa5d1";

/**
 * Default network request timeout in milliseconds
 * @constant
 */
const DEFAULT_NETWORK_TIMEOUT = 5000;

/**
 * Represents a cached value with timestamp
 * @interface CacheEntry
 */
interface CacheEntry {
  /** The cached value */
  value: any;
  /** Unix timestamp when the value was cached */
  timestamp: number;
}

/**
 * Cache storage structure
 * @interface Cache
 */
interface Cache {
  [key: string]: CacheEntry;
}

/**
 * IP information from ipinfo.io API
 * @interface IPInfo
 */
interface IPInfo {
  /** Public IP address */
  ip?: string;
  /** City location */
  city?: string;
  /** Reverse DNS hostname */
  hostname?: string;
  /** ISP organization string (includes AS number) */
  org?: string;
}

/**
 * Context object passed to info collection functions
 * @interface InfoContext
 */
interface InfoContext {
  /** Cache storage */
  cache: Cache;
  /** IP information from external API */
  ipInfo?: IPInfo;
}

/**
 * Loads cache from disk
 * @returns {Cache} Cached data or empty object if cache doesn't exist or is corrupted
 */
function loadCache(): Cache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    }
  } catch (error) {
    // Corrupted cache - return empty object
  }
  return {};
}

/**
 * Saves cache to disk
 * @param {Cache} cache - Cache object to save
 */
function saveCache(cache: Cache): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    // Silently fail if can't write cache
  }
}

/**
 * Checks if a cache entry is still valid based on configured duration
 * @param {CacheEntry} cacheEntry - The cache entry to validate
 * @param {string} key - The key name to determine cache duration
 * @returns {boolean} True if cache is still valid
 */
function isCacheValid(cacheEntry: CacheEntry, key: string): boolean {
  if (!cacheEntry || !cacheEntry.timestamp) return false;
  const age = Date.now() - cacheEntry.timestamp;
  const maxAge = CACHE_DURATION[key as keyof typeof CACHE_DURATION] || 60000;
  return age < maxAge;
}

/**
 * Retrieves a value from cache if valid
 * @param {Cache} cache - Cache object
 * @param {string} key - Key to retrieve
 * @returns {any} Cached value or null if not found/expired
 */
function getCachedValue(cache: Cache, key: string): any {
  if (!cache[key]) return null;
  const cacheEntry = cache[key];
  if (!isCacheValid(cacheEntry, key)) {
    delete cache[key];
    return null;
  }
  return cacheEntry.value;
}

/**
 * Stores a value in cache with current timestamp
 * @param {Cache} cache - Cache object
 * @param {string} key - Key to store under
 * @param {any} value - Value to cache
 */
function setCachedValue(cache: Cache, key: string, value: any): void {
  cache[key] = {
    value,
    timestamp: Date.now(),
  };
}

/**
 * Executes a shell command safely with timeout
 * @param {string} command - Command to execute
 * @param {object} options - Additional options for execSync
 * @returns {string} Command output or empty string on error
 */
function execCommand(command: string, options = {}): string {
  try {
    const cmd = IS_WINDOWS ? `cmd /c ${command}` : command;
    return execSync(cmd, {
      encoding: "utf8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "ignore"],
      ...options,
    })
      .toString()
      .trim();
  } catch (error) {
    return "";
  }
}

/**
 * Checks if a command exists in the system PATH
 * @param {string} command - Command name to check
 * @returns {boolean} True if command exists
 */
function commandExists(command: string): boolean {
  try {
    if (IS_WINDOWS) {
      execSync(`where ${command}`, { stdio: "ignore" });
    } else {
      execSync(`which ${command}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches IP geolocation information from ipinfo.io API
 * @param {string} token - IPInfo.io API token
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<IPInfo>} IP information object or empty object on error
 */
async function fetchIPInfo(
  token: string = DEFAULT_IPINFO_TOKEN,
  timeout: number = DEFAULT_NETWORK_TIMEOUT
): Promise<IPInfo> {
  return new Promise((resolve) => {
    const url = `https://ipinfo.io/json${token ? `?token=${token}` : ""}`;

    const req = https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    });

    req.on("error", () => resolve({}));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve({});
    });
  });
}

/**
 * System information collection functions
 * Each function returns a clean string value without formatting
 * @namespace infoFunctions
 */
export const infoFunctions = {
  /**
   * Gets the current username
   * @returns Current system username
   */
  user(): string {
    return os.userInfo().username;
  },

  /**
   * Gets the system hostname
   * @returns Computer hostname/network name
   */
  hostname(): string {
    return os.hostname();
  },

  /**
   * Gets public IP address from ipinfo.io
   * @param context - Info context with cache and IP info
   * @returns Public IPv4 address or empty string
   * @example "203.0.113.42"
   */
  async ip(context: InfoContext): Promise<string> {
    const cached = getCachedValue(context.cache, "ip");
    if (cached) return cached;

    if (!context.ipInfo) {
      setCachedValue(context.cache, "ip", "");
      return "";
    }
    const ip = context.ipInfo.ip || "";
    setCachedValue(context.cache, "ip", ip);
    return ip;
  },

  /**
   * Gets local/private IP address(es)
   * Tries ifconfig and ip commands on Linux, falls back to Node.js API
   * @returns Space-separated local IP addresses (RFC 1918 ranges)
   * @example "192.168.1.100" or "10.0.0.50 192.168.1.100"
   */
  iplocal(): string {
    if (IS_LINUX) {
      try {
        const ifconfig = execCommand("ifconfig 2>/dev/null");
        const wlanMatch = ifconfig.match(
          /wlan0[\s\S]*?inet (\d+\.\d+\.\d+\.\d+)/
        );
        if (wlanMatch) {
          return wlanMatch[1];
        }
      } catch {}

      try {
        const ipAddr = execCommand("ip addr show 2>/dev/null");
        const addresses: string[] = [];
        const matches = ipAddr.matchAll(/inet (\d+\.\d+\.\d+\.\d+)\/\d+/g);
        for (const match of matches) {
          if (!match[1].startsWith("127.")) {
            addresses.push(match[1]);
          }
        }
        if (addresses.length > 0) {
          return addresses.join(" ");
        }
      } catch {}
    }

    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    for (const name of Object.keys(interfaces)) {
      for (const device of interfaces[name] || []) {
        if (device.family === "IPv4" && !device.internal) {
          addresses.push(device.address);
        }
      }
    }

    return addresses.join(" ");
  },

  /**
   * Gets geographic city based on public IP
   * @param context - Info context with IP geolocation data
   * @returns City name or empty string
   * @example "San Francisco", "New York", "London"
   */
  async city(context: InfoContext): Promise<string> {
    const cached = getCachedValue(context.cache, "city");
    if (cached !== null) return cached;

    if (!context.ipInfo || !context.ipInfo.city) {
      setCachedValue(context.cache, "city", "");
      return "";
    }
    const city = context.ipInfo.city;
    setCachedValue(context.cache, "city", city);
    return city;
  },

  /**
   * Gets reverse DNS hostname with HTTP prefix
   * @param context - Info context with IP info
   * @returns Domain with http:// prefix or empty string
   * @example "http://example.com", "http://host-203-0-113-42.example.net"
   */
  async domain(context: InfoContext): Promise<string> {
    const cached = getCachedValue(context.cache, "domain");
    if (cached !== null) return cached;

    if (!context.ipInfo || !context.ipInfo.hostname) {
      setCachedValue(context.cache, "domain", "");
      return "";
    }
    const domain = `http://${context.ipInfo.hostname}`;
    setCachedValue(context.cache, "domain", domain);
    return domain;
  },

  /**
   * Gets Internet Service Provider name
   * Strips AS number prefix from organization string
   * @param context - Info context with IP info
   * @returns ISP name or empty string
   * @example "Comcast Cable", "Verizon Business", "Cloudflare Inc"
   */
  async isp(context: InfoContext): Promise<string> {
    const cached = getCachedValue(context.cache, "isp");
    if (cached !== null) return cached;

    if (!context.ipInfo || !context.ipInfo.org) {
      setCachedValue(context.cache, "isp", "");
      return "";
    }
    const isp = context.ipInfo.org.split(" ").slice(1).join(" ");
    setCachedValue(context.cache, "isp", isp);
    return isp;
  },

  /**
   * Gets operating system name and version
   * Platform-specific detection for Windows, macOS, and Linux
   * @param context - Info context with cache
   * @returns OS name and version string
   * @example "Windows 11 Pro", "macOS Ventura 13.2.1", "Ubuntu 22.04.3 LTS"
   */
  os(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "os");
    if (cached) return cached;

    const platform = os.platform();
    const release = os.release();
    let osName = "";

    if (IS_WINDOWS) {
      try {
        const version = execCommand("ver");
        const match = version.match(/Microsoft Windows \[Version ([^\]]+)\]/);
        osName = match ? `Windows ${match[1]}` : `Windows ${release}`;
      } catch {
        osName = `Windows ${release}`;
      }
    } else if (IS_MAC) {
      osName = `macOS ${release}`;
    } else if (IS_LINUX) {
      try {
        const osRelease = fs.readFileSync("/etc/os-release", "utf8");
        const nameMatch = osRelease.match(/^NAME="([^"]+)"/m);
        const versionMatch = osRelease.match(/^VERSION_ID="([^"]+)"/m);
        osName = nameMatch ? nameMatch[1] : "Linux";
        if (versionMatch) osName += ` ${versionMatch[1]}`;
      } catch {
        osName = `Linux ${release}`;
      }
    } else {
      osName = `${platform} ${release}`;
    }

    setCachedValue(context.cache, "os", osName);
    return osName;
  },

  /**
   * Gets CPU model name and specifications
   * Uses platform-specific commands (wmic/lscpu/cpuinfo)
   * Automatically strips "with Radeon Graphics" and similar suffixes
   * @param context - Info context with cache
   * @returns CPU model string or empty string
   * @example "Intel Core i7-12700K", "AMD Ryzen 9 5900HX", "Apple M2 Pro"
   */
  cpu(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "cpu");
    if (cached) return cached;

    let cpuName = "";

    if (IS_WINDOWS) {
      try {
        const wmic = execCommand("wmic cpu get name /format:list");
        const nameMatch = wmic.match(/Name=(.+)/);
        if (nameMatch) {
          cpuName = nameMatch[1].trim();
        }
      } catch {}

      if (!cpuName) {
        try {
          const ps = execCommand(
            'powershell.exe -Command "Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty Name"'
          );
          if (ps.trim()) {
            cpuName = ps.trim();
          }
        } catch {}
      }
    } else if (IS_LINUX) {
      try {
        const lscpu = execCommand("lscpu");
        const modelMatch = lscpu.match(/Model name:\s*([^\n,]+)/);
        if (modelMatch) {
          cpuName = modelMatch[1].trim();
        }
      } catch {}

      if (!cpuName) {
        try {
          const cpuInfo = fs.readFileSync("/proc/cpuinfo", "utf8");
          const modelMatch = cpuInfo.match(/model name\s*:\s*([^\n]+)/);
          const hardwareMatch = cpuInfo.match(/Hardware\s*:\s*([^\n]+)/);

          if (modelMatch) {
            cpuName = modelMatch[1].trim();
          } else if (hardwareMatch) {
            cpuName = hardwareMatch[1].trim();
          }
        } catch {}
      }
    } else {
      const cpus = os.cpus();
      if (cpus.length > 0) {
        cpuName = cpus[0].model.trim().replace(/[\r\n]+/g, " ");
      }
    }

    if (!cpuName) {
      setCachedValue(context.cache, "cpu", "");
      return "";
    }

    cpuName = cpuName.trim().replace(/with .*/, "");

    setCachedValue(context.cache, "cpu", cpuName);
    return cpuName;
  },

  /**
   * Gets graphics card model name
   * Extracts GPU info from lspci (Linux) or WMI (Windows)
   * Filters out basic/generic display adapters
   * @param context - Info context with cache
   * @returns GPU model string or empty string
   * @example "NVIDIA GeForce RTX 4070", "AMD Radeon RX 6800 XT"
   */
  gpu(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "gpu");
    if (cached !== null) return cached;

    if (IS_WINDOWS) {
      try {
        const wmic = execCommand(
          "wmic path win32_VideoController get name /format:list"
        );
        const nameMatch = wmic.match(/Name=(.+)/);
        if (nameMatch) {
          const gpu = nameMatch[1].trim();
          if (gpu && gpu !== "" && !gpu.includes("Microsoft Basic")) {
            setCachedValue(context.cache, "gpu", gpu);
            return gpu;
          }
        }
      } catch {}

      try {
        const ps = execCommand(
          "powershell.exe -Command \"Get-WmiObject -Class Win32_VideoController | Where-Object {$_.Name -notlike '*Microsoft Basic*'} | Select-Object -First 1 -ExpandProperty Name\""
        );
        if (ps.trim()) {
          const gpu = ps.trim();
          setCachedValue(context.cache, "gpu", gpu);
          return gpu;
        }
      } catch {}
    } else if (IS_LINUX) {
      try {
        const lspci = execCommand("lspci");
        const gpuMatch = lspci.match(
          /VGA.*?(RTX|GeForce|AMD|Intel|NVIDIA)[^\n]*/i
        );
        if (gpuMatch) {
          let gpu = gpuMatch[0];

          const bracketMatch = gpu.match(/\[([^\]]+)\]/);
          if (bracketMatch) {
            gpu = bracketMatch[1];
          } else {
            gpu = gpu
              .replace(/^.*VGA[^:]*:\s*/, "")
              .replace(/\s*\(.*\)$/, "")
              .trim();
          }

          if (gpu) {
            setCachedValue(context.cache, "gpu", gpu);
            return gpu;
          }
        }
      } catch {}
    }

    setCachedValue(context.cache, "gpu", "");
    return "";
  },

  /**
   * Gets root filesystem disk usage percentage
   * Uses df command on Linux/Android
   * @param context - Info context with cache
   * @returns Percentage string or empty string
   * @example "45%", "78%"
   */
  disk_used(context: InfoContext): string {
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
              const percentIndex = parts.findIndex((part) =>
                part.includes("%")
              );
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
  },

  /**
   * Gets memory usage in gigabytes
   * Reads from /proc/meminfo on Linux, falls back to os.totalmem()
   * @param context - Info context with cache
   * @returns Memory usage as "used/total GB"
   * @example "12/32GB", "6/16GB"
   */
  ram_used(context: InfoContext): string {
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
  },

  /**
   * Gets the highest CPU-consuming process
   * Uses ps command to find top process by CPU usage (Linux only)
   * @param context - Info context with cache
   * @returns Process info as "percentage processname" or empty string
   * @example "8% firefox", "15% chrome", "3% systemd"
   */
  top_process(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "top_process");
    if (cached !== null) return cached;

    if (IS_LINUX) {
      try {
        const ps = execCommand("ps -eo pcpu,comm --sort=-%cpu --no-headers");
        const lines = ps.split("\n");
        if (lines.length > 0) {
          const topProcess = lines[0].trim().replace(/\s+/, " ").split(" ");
          const cpu = topProcess[0].replace(/\.\d+/, "%");
          const process = topProcess[1].split("/").pop();
          const result = `${cpu} ${process}`;
          setCachedValue(context.cache, "top_process", result);
          return result;
        }
      } catch {}
    }

    setCachedValue(context.cache, "top_process", "");
    return "";
  },

  /**
   * Gets system uptime since last boot
   * @returns Uptime formatted as "Xd Yh Zm"
   * @example "2d 14h 23m", "0d 3h 45m"
   */
  uptime(): string {
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  },

  /**
   * Gets device or computer model name
   * Uses WMI on Windows, DMI on Linux, getprop on Android
   * @param context - Info context with cache
   * @returns Device model name or empty string
   * @example "Dell OptiPlex 7090", "MacBook Pro 16-inch", "Valve Steam Deck"
   */
  device(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "device");
    if (cached !== null) return cached;

    if (IS_WINDOWS) {
      try {
        const wmic = execCommand("wmic csproduct get name /format:list");
        const nameMatch = wmic.match(/Name=(.+)/);
        if (nameMatch) {
          const device = nameMatch[1].trim();
          if (device && device !== "") {
            setCachedValue(context.cache, "device", device);
            return device;
          }
        }
      } catch {}

      try {
        const ps = execCommand(
          'powershell.exe -Command "Get-WmiObject -Class Win32_ComputerSystem | Select-Object -ExpandProperty Model"'
        );
        if (ps.trim()) {
          const device = ps.trim();
          setCachedValue(context.cache, "device", device);
          return device;
        }
      } catch {}
    } else if (IS_LINUX) {
      try {
        if (commandExists("getprop")) {
          const device = execCommand("getprop ro.product.model");
          if (device) {
            setCachedValue(context.cache, "device", device);
            return device;
          }
        }

        const dmiPath = "/sys/devices/virtual/dmi/id/product_name";
        if (fs.existsSync(dmiPath)) {
          const device = fs.readFileSync(dmiPath, "utf8").trim();
          if (device) {
            setCachedValue(context.cache, "device", device);
            return device;
          }
        }
      } catch {}
    }

    setCachedValue(context.cache, "device", "");
    return "";
  },

  /**
   * Gets kernel version string
   * Returns the operating system kernel version from os.release()
   * @param context - Info context with cache
   * @returns Kernel version string
   * @example "5.15.0-56-generic", "6.11.11-valve12-1-neptune"
   */
  kernel(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "kernel");
    if (cached) return cached;

    const kernel = os.release();
    setCachedValue(context.cache, "kernel", kernel);
    return kernel;
  },

  /**
   * Gets the current shell name
   * Uses ps command to find parent process shell (Linux/Unix only)
   * @returns Shell name or empty string on Windows
   * @example "bash", "zsh", "fish", "nu"
   */
  shell(): string {
    if (IS_LINUX) {
      try {
        const ppid = process.ppid;
        const shell = execCommand(`ps -p ${ppid} -o comm=`).split("/").pop();
        return shell || "";
      } catch {}
    }
    return "";
  },

  /**
   * Gets available package managers and development tools
   * Checks for package managers (apt, yum, npm, etc.) and editors (nvim, hx)
   * @param context - Info context with cache
   * @returns Space-separated list of available commands
   * @example "apt npm docker nvim", "yay pacman bun hx"
   */
  pacman(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "pacman");
    if (cached !== null) return cached;

    const commands = [
      "apt",
      "npm",
      "uv",
      "docker",
      "hx",
      "nvim",
      "bun",
      "yay",
      "pacman",
      "yum",
      "dnf",
      "zypper",
      "emerge",
      "apk",
      "snap",
      "flatpak",
    ];
    const available = commands.filter((cmd) => commandExists(cmd));

    const result = available.join(" ");
    setCachedValue(context.cache, "pacman", result);
    return result;
  },

  /**
   * Gets open TCP ports with service names
   * Uses lsof to find listening TCP ports (Linux only)
   * @param context - Info context with cache
   * @returns Space-separated port+process pairs or empty string
   * @example "80http 443http 22ssh", "3000node 5432post"
   */
  ports(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "ports");
    if (cached !== null) return cached;

    if (IS_LINUX) {
      try {
        const lsof = execCommand("lsof -nP -iTCP -sTCP:LISTEN");
        const lines = lsof.split("\n").slice(1);
        const ports = new Set<string>();

        lines.forEach((line) => {
          const parts = line.split(/\s+/);
          if (parts.length >= 9) {
            const address = parts[8];
            const portMatch = address.match(/:(\d+)$/);
            if (portMatch) {
              const port = portMatch[1];
              const process = parts[0].substring(0, 4);
              ports.add(`${port}${process}`);
            }
          }
        });

        const result = Array.from(ports).join(" ");
        setCachedValue(context.cache, "ports", result);
        return result;
      } catch {}
    }

    setCachedValue(context.cache, "ports", "");
    return "";
  },

  /**
   * Gets running Docker container names
   * Lists active Docker containers with their names
   * @param context - Info context with cache
   * @returns Space-separated container names or empty string
   * @example "nginx redis postgres", "web-app db-server"
   */
  containers(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "containers");
    if (cached !== null) return cached;

    if (!commandExists("docker")) {
      setCachedValue(context.cache, "containers", "");
      return "";
    }

    try {
      const containerCount = execCommand("docker ps -q")
        .split("\n")
        .filter((line) => line.trim()).length;
      if (containerCount === 0) {
        setCachedValue(context.cache, "containers", "");
        return "";
      }

      const containers = execCommand(
        'docker ps --format "{{.Names}}\t{{.Ports}}"'
      );
      const lines = containers.split("\n").filter((line) => line.trim());

      const containerInfo: string[] = [];

      lines.forEach((line) => {
        const [name, ports] = line.split("\t");
        if (name) {
          containerInfo.push(name);

          if (ports) {
            const portMatches = ports.match(/->(\d+(-\d+)?)\//g);
            if (portMatches) {
              const uniquePorts = [
                ...new Set(
                  portMatches.map((p) => p.replace(/->\d+(-\d+)?\//, ""))
                ),
              ];
              containerInfo.push(...uniquePorts);
            }
          }
        }
      });

      const result = containerInfo.join(" ");
      setCachedValue(context.cache, "containers", result);
      return result;
    } catch {}

    setCachedValue(context.cache, "containers", "");
    return "";
  },

  /**
   * Gets available memory in gigabytes
   * Reads MemAvailable from /proc/meminfo (Linux only)
   * @returns Available memory with "GB available" suffix or empty string
   * @example "12GB available", "4GB available"
   */
  memory_available(): string {
    if (!IS_LINUX) return "";

    try {
      const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
      const availableMatch = meminfo.match(/MemAvailable:\s+(\d+) kB/);
      if (availableMatch) {
        const availableGB = Math.round(
          parseInt(availableMatch[1]) / 1024 / 1024
        );
        return `${availableGB}GB available`;
      }
    } catch {}
    return "";
  },

  /**
   * Gets swap memory usage
   * Calculates swap usage from /proc/meminfo (Linux only)
   * @returns Swap usage as "percentage (size MB) swap" or empty string
   * @example "15% (512MB) swap", "0% (0MB) swap"
   */
  swap_used(): string {
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
  },

  /**
   * Gets system load averages
   * Reads 1, 5, and 15 minute load averages from /proc/loadavg (Linux only)
   * @returns Space-separated load averages (1m 5m 15m) or empty string
   * @example "0.52 0.58 0.59", "2.10 1.95 1.88"
   */
  load_average(): string {
    if (!IS_LINUX) return "";

    try {
      const loadavg = fs.readFileSync("/proc/loadavg", "utf8");
      const loads = loadavg.split(" ").slice(0, 3);
      return loads.join(" ");
    } catch {}
    return "";
  },

  users_logged_in(): string {
    if (!IS_LINUX) return "";

    try {
      const who = execCommand("who");
      const users = who.split("\n").filter((line) => line.trim()).length;
      if (users > 0) {
        return `${users} users`;
      }
    } catch {}
    return "";
  },

  network_interfaces(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "network_interfaces");
    if (cached !== null) return cached;

    if (!IS_LINUX) {
      setCachedValue(context.cache, "network_interfaces", "");
      return "";
    }

    try {
      const interfaces = os.networkInterfaces();
      const activeInterfaces: string[] = [];

      for (const [name, addrs] of Object.entries(interfaces)) {
        if (name !== "lo") {
          const ipv4Addr = addrs?.find(
            (addr) => addr.family === "IPv4" && !addr.internal
          );
          if (ipv4Addr) {
            activeInterfaces.push(name);
          }
        }
      }

      const result = activeInterfaces.join(" ");
      setCachedValue(context.cache, "network_interfaces", result);
      return result;
    } catch {}

    setCachedValue(context.cache, "network_interfaces", "");
    return "";
  },

  mount_points(context: InfoContext): string {
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
  },

  services_running(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "services_running");
    if (cached !== null) return cached;

    if (!IS_LINUX) {
      setCachedValue(context.cache, "services_running", "");
      return "";
    }

    try {
      let serviceCount = 0;

      if (commandExists("systemctl")) {
        const services = execCommand(
          "systemctl list-units --type=service --state=running --no-pager"
        );
        serviceCount = services
          .split("\n")
          .filter((line) => line.includes(".service")).length;
      } else if (commandExists("service")) {
        const services = execCommand("service --status-all");
        serviceCount = services
          .split("\n")
          .filter((line) => line.includes("+")).length;
      }

      if (serviceCount > 0) {
        const result = `${serviceCount} services`;
        setCachedValue(context.cache, "services_running", result);
        return result;
      }
    } catch {}

    setCachedValue(context.cache, "services_running", "");
    return "";
  },

  temperature(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "temperature");
    if (cached !== null) return cached;

    if (!IS_LINUX) {
      setCachedValue(context.cache, "temperature", "");
      return "";
    }

    try {
      const tempSources = [
        "/sys/class/thermal/thermal_zone0/temp",
        "/sys/class/hwmon/hwmon0/temp1_input",
        "/sys/class/hwmon/hwmon1/temp1_input",
      ];

      for (const source of tempSources) {
        if (fs.existsSync(source)) {
          const temp = fs.readFileSync(source, "utf8").trim();
          const tempC = Math.round(parseInt(temp) / 1000);

          if (tempC > 0 && tempC < 150) {
            const result = `${tempC}°C`;
            setCachedValue(context.cache, "temperature", result);
            return result;
          }
        }
      }
    } catch {}

    setCachedValue(context.cache, "temperature", "");
    return "";
  },

  battery(context: InfoContext): string {
    const cached = getCachedValue(context.cache, "battery");
    if (cached !== null) return cached;

    if (!IS_LINUX) {
      setCachedValue(context.cache, "battery", "");
      return "";
    }

    try {
      const batteryPath = "/sys/class/power_supply/BAT0";
      const capacityPath = `${batteryPath}/capacity`;
      const statusPath = `${batteryPath}/status`;

      if (fs.existsSync(capacityPath)) {
        const capacity = fs.readFileSync(capacityPath, "utf8").trim();
        const status = fs.existsSync(statusPath)
          ? fs.readFileSync(statusPath, "utf8").trim()
          : "Unknown";

        const batteryPercent = parseInt(capacity);
        const isCharging = status === "Charging";
        const result = `${batteryPercent}%${isCharging ? "+" : ""}`;
        setCachedValue(context.cache, "battery", result);
        return result;
      }
    } catch {}

    setCachedValue(context.cache, "battery", "");
    return "";
  },

  screen_resolution(): string {
    if (!IS_LINUX) return "";

    try {
      if (process.env.DISPLAY) {
        const xrandr = execCommand("xrandr");
        const resolutionMatch = xrandr.match(/(\d+x\d+)\+\d+\+\d+/);
        if (resolutionMatch) {
          return resolutionMatch[1];
        }
      }
    } catch {}
    return "";
  },
};

/**
 * Get all system information as a clean JSON object
 * @param options Configuration options
 * @returns Promise resolving to SystemInfo object
 */
export async function getSystemInfo(
  options: SystemInfoOptions = {}
): Promise<SystemInfo> {
  const cache = loadCache();
  const context: InfoContext = { cache };

  // Check if we need IP info
  const cachedIPInfo = getCachedValue(cache, "ipInfo");
  if (cachedIPInfo) {
    context.ipInfo = cachedIPInfo;
  } else {
    context.ipInfo = await fetchIPInfo();
    setCachedValue(cache, "ipInfo", context.ipInfo);
  }

  // Collect all system information
  const info: Partial<SystemInfo> = {
    timestamp: new Date().toISOString(),
    platform: IS_WINDOWS
      ? "windows"
      : IS_MAC
      ? "macos"
      : IS_LINUX
      ? "linux"
      : "unknown",
  };

  // Call all info functions
  for (const [key, fn] of Object.entries(infoFunctions)) {
    try {
      const value = await fn(context);
      info[key as keyof SystemInfo] = value as any;
    } catch (error) {
      info[key as keyof SystemInfo] = "" as any;
    }
  }

  saveCache(cache);

  return info as SystemInfo;
}

export { loadCache, saveCache };
