#!/usr/bin/env node
import os from 'os';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);


// Cache configuration
const CACHE_FILE = path.join(os.tmpdir(), 'systeminfo-cache.json');
const SETTINGS_FILE = path.join(os.homedir(), '.config', 'systeminfo-settings.json');
const CACHE_DURATION = {
  // Cache durations in milliseconds
  ip: 5 * 60 * 1000,        // 5 minutes for IP info
  cpu: 24 * 60 * 60 * 1000, // 24 hours for CPU info
  gpu: 24 * 60 * 60 * 1000, // 24 hours for GPU info
  os: 24 * 60 * 60 * 1000,  // 24 hours for OS info
  device: 24 * 60 * 60 * 1000, // 24 hours for device info
  kernel: 60 * 60 * 1000,   // 1 hour for kernel (can change on updates)
  pacman: 10 * 60 * 1000,   // 10 minutes for installed packages
  ports: 5 * 60 * 1000,         // 30 seconds for ports (changes frequently)
  containers: 5 * 60 * 1000,    // 30 seconds for containers
  top_process: 5 * 1000,    // 5 seconds for top process
  disk_used: 60 * 1000,     // 1 minute for disk usage
  ram_used: 10 * 1000,      // 10 seconds for RAM usage
  services_running: 5 * 60 * 1000, // 30 seconds for services
  temperature: 30 * 1000,   // 30 seconds for temperature
  battery: 60 * 1000,       // 1 minute for battery
  network_interfaces: 5 * 60 * 1000, // 5 minutes for network interfaces
  mount_points: 10 * 60 * 1000      // 10 minutes for mount points
};

// Default settings
const DEFAULT_SETTINGS = {
  display_order: [
    ['user', 'hostname', 'os', 'device', 'kernel', 'cpu', 'gpu',],
    ['disk_used', 'ram_used', 'top_process', 'uptime', 'temperature', 'battery', 'load_average'],
    ['ip', 'iplocal', 'city', 'domain', 'isp'],
    ['shell', 'pacman', 'services_running', 'containers']
    // ['ports']
  ],
  colors: {
    user: "red",
    hostname: "orange",
    disk_used: "purple",
    ram_used: "yellow",
    top_process: "magenta",
    uptime: "cyan",
    ip: "green",
    iplocal: "yellow",
    city: "green",
    domain: "gray",
    isp: "lightblue",
    os: "gray",
    cpu: "orange",
    gpu: "yellow",
    device: "yellow",
    kernel: "green",
    shell: "orange",
    pacman: "multicolor",
    ports: "multicolor",
    containers: "green",
    memory_available: "blue",
    swap_used: "purple",
    load_average: "red",
    users_logged_in: "cyan",
    network_interfaces: "yellow",
    mount_points: "gray",
    services_running: "green",
    temperature: "red",
    battery: "green",
    screen_resolution: "blue"
  },
  cache: {
    enabled: true,
    custom_durations: {}
  },
  network: {
    timeout: 5000,
    ipinfo_token: "da2d6cc4baa5d1",
    show_offline_message: true
  },
  display: {
    show_emojis: true,
    compact_mode: false,
    separator: "\n",
    multiline: true,
    group_similar: true,
    single_line: false,
    line_wrap_length: process?.stdout?.columns || 100, // fallback to 80 if tput fails
  },
  advanced: {
    debug: false,
    performance_logging: false,
    fallback_commands: true
  }
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[38;5;196m',
  orange: '\x1b[38;5;208m',
  yellow: '\x1b[38;5;226m',
  green: '\x1b[38;5;46m',
  blue: '\x1b[38;5;39m',
  cyan: '\x1b[38;5;51m',
  purple: '\x1b[38;5;171m',
  magenta: '\x1b[38;5;213m',
  gray: '\x1b[38;5;250m',
  lightblue: '\x1b[38;5;220m'
};

// Platform detection constants
const IS_WINDOWS = os.platform() === 'win32';
const IS_MAC = os.platform() === 'darwin';
const IS_LINUX = os.platform() === 'linux';

// Cache management functions
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      return cacheData;
    }
  } catch (error) {
    // If cache is corrupted, ignore it
  }
  return {};
}

function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    // Silently fail if can't write cache
  }
}

function isCacheValid(cacheEntry, key) {
  if (!cacheEntry || !cacheEntry.timestamp) return false;
  const age = Date.now() - cacheEntry.timestamp;
  const maxAge = CACHE_DURATION[key] || 60000; // Default 1 minute
  return age < maxAge;
}

// Cache helper functions
function getCachedValue(cache, key, settings = null) {
  if (!cache[key]) return null;

  const cacheEntry = cache[key];
  if (!isCacheValid(cacheEntry, key)) {
    delete cache[key];
    return null;
  }

  return cacheEntry.value;
}

function setCachedValue(cache, key, value) {
  cache[key] = {
    value: value,
    timestamp: Date.now()
  };
}

// Settings save function
function saveSettings(settings) {
  try {
    const configDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

function loadSettings() {
  let settings;
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      // Merge with defaults to ensure all properties exist
      settings = { ...DEFAULT_SETTINGS, ...settings };
    } else {
      settings = DEFAULT_SETTINGS;
    }
  } catch {
    settings = DEFAULT_SETTINGS;
  }
  return settings;
}

// Helper function to execute shell commands safely
function execCommand(command, options = {}) {
  try {
    const cmd = IS_WINDOWS ? `cmd /c ${command}` : command;
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'ignore'],
      ...options
    }).toString().trim();
  } catch (error) {
    return '';
  }
}

// Helper function to check if command exists
function commandExists(command) {
  try {
    if (IS_WINDOWS) {
      execSync(`where ${command}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${command}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

// Helper function to fetch IP info from ipinfo.io
async function fetchIPInfo(settings) {
  return new Promise((resolve) => {
    const token = settings.network.ipinfo_token;
    const timeout = settings.network.timeout;
    const url = `https://ipinfo.io/json${token ? `?token=${token}` : ''}`;

    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    });

    req.on('error', () => resolve({}));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve({});
    });
  });
}

// System info functions
const infoFunctions = {
  user(settings) {
    const color = colors[settings.colors.user] || colors.red;
    const emoji = settings.display.show_emojis ? '👤 ' : '';
    return `${color}${emoji}${os.userInfo().username}`;
  },

  hostname(settings) {
    const color = colors[settings.colors.hostname] || colors.orange;
    const emoji = settings.display.show_emojis ? '🏠 ' : '';
    return `${color}${emoji}${os.hostname()}`;
  },

  async ip(settings) {
    const cached = getCachedValue(this.cache, 'ip', settings);
    if (cached) return cached;

    if (!this.ipInfo) {
      const emoji = settings.display.show_emojis ? '🌎 ' : '';
      const result = settings.network.show_offline_message ?
        `${colors.gray}${emoji}No Network` : '';
      setCachedValue(this.cache, 'ip', result);
      return result;
    }
    const ip = this.ipInfo.ip || 'No IP';
    const color = colors[settings.colors.ip] || colors.green;
    const emoji = settings.display.show_emojis ? '🌎 ' : '';
    const result = `${color}${emoji}${ip}`;
    setCachedValue(this.cache, 'ip', result);
    return result;
  },

  iplocal(settings) {
    const color = colors[settings.colors.iplocal] || colors.yellow;
    const emoji = settings.display.show_emojis ? '🌐 ' : '';

    if (IS_LINUX) {
      // Try ifconfig first (like bash script)
      try {
        const ifconfig = execCommand('ifconfig 2>/dev/null');
        const wlanMatch = ifconfig.match(/wlan0[\s\S]*?inet (\d+\.\d+\.\d+\.\d+)/);
        if (wlanMatch) {
          return `${color}${emoji}${wlanMatch[1]}`;
        }
      } catch { }

      // Fallback to ip command (like bash script)
      try {
        const ipAddr = execCommand('ip addr show 2>/dev/null');
        const addresses = [];
        const matches = ipAddr.matchAll(/inet (\d+\.\d+\.\d+\.\d+)\/\d+/g);
        for (const match of matches) {
          if (!match[1].startsWith('127.')) {
            addresses.push(match[1]);
          }
        }
        if (addresses.length > 0) {
          return `${color}${emoji}${addresses.join(' ')}`;
        }
      } catch { }
    }

    // Fallback to Node.js method
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
      for (const device of interfaces[name]) {
        if (device.family === 'IPv4' && !device.internal) {
          addresses.push(device.address);
        }
      }
    }

    if (addresses.length === 0) return '';
    return `${color}${emoji}${addresses.join(' ')}`;
  },

  async city(settings) {
    const cached = getCachedValue(this.cache, 'city', settings);
    if (cached) return cached;

    if (!this.ipInfo || !this.ipInfo.city) {
      setCachedValue(this.cache, 'city', '');
      return '';
    }
    const color = colors[settings.colors.city] || colors.green;
    const emoji = settings.display.show_emojis ? '📍 ' : '';
    const result = `${color}${emoji}${this.ipInfo.city}`;
    setCachedValue(this.cache, 'city', result);
    return result;
  },

  async domain(settings) {
    const cached = getCachedValue(this.cache, 'domain', settings);
    if (cached) return cached;

    if (!this.ipInfo || !this.ipInfo.hostname) {
      setCachedValue(this.cache, 'domain', '');
      return '';
    }
    const color = colors[settings.colors.domain] || colors.gray;
    const emoji = settings.display.show_emojis ? '🔗 ' : '';
    const result = `${color}${emoji}http://${this.ipInfo.hostname}`;
    setCachedValue(this.cache, 'domain', result);
    return result;
  },

  async isp(settings) {
    const cached = getCachedValue(this.cache, 'isp', settings);
    if (cached) return cached;

    if (!this.ipInfo || !this.ipInfo.org) {
      setCachedValue(this.cache, 'isp', '');
      return '';
    }
    const isp = this.ipInfo.org.split(' ').slice(1).join(' '); // Remove AS number
    const color = colors[settings.colors.isp] || colors.lightblue;
    const emoji = settings.display.show_emojis ? '👮 ' : '';
    const result = `${color}${emoji}${isp}`;
    setCachedValue(this.cache, 'isp', result);
    return result;
  },

  os(settings) {
    const cached = getCachedValue(this.cache, 'os', settings);
    if (cached) return cached;

    const platform = os.platform();
    const release = os.release();
    let osName = '';

    if (IS_WINDOWS) {
      try {
        const version = execCommand('ver');
        const match = version.match(/Microsoft Windows \[Version ([^\]]+)\]/);
        osName = match ? `Windows ${match[1]}` : `Windows ${release}`;
      } catch {
        osName = `Windows ${release}`;
      }
    } else if (IS_MAC) {
      osName = `macOS ${release}`;
    } else if (IS_LINUX) {
      try {
        const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
        const nameMatch = osRelease.match(/^NAME="([^"]+)"/m);
        const versionMatch = osRelease.match(/^VERSION_ID="([^"]+)"/m);
        osName = nameMatch ? nameMatch[1] : 'Linux';
        if (versionMatch) osName += ` ${versionMatch[1]}`;
      } catch {
        osName = `Linux ${release}`;
      }
    } else {
      osName = `${platform} ${release}`;
    }

    const color = colors[settings.colors.os] || colors.blue;
    const emoji = settings.display.show_emojis ? '⚡ ' : '';
    const result = `${color}${emoji}${osName}`;
    setCachedValue(this.cache, 'os', result);
    return result;
  },

  cpu(settings) {
    const cached = getCachedValue(this.cache, 'cpu', settings);
    if (cached) return cached;

    let cpuName = '';

    if (IS_WINDOWS) {
      // Windows-specific CPU detection using WMIC
      try {
        const wmic = execCommand('wmic cpu get name /format:list');
        const nameMatch = wmic.match(/Name=(.+)/);
        if (nameMatch) {
          cpuName = nameMatch[1].trim();
        }
      } catch { }

      // Fallback to PowerShell if WMIC fails
      if (!cpuName) {
        try {
          const ps = execCommand('powershell.exe -Command "Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty Name"');
          if (ps.trim()) {
            cpuName = ps.trim();
          }
        } catch { }
      }
    } else if (IS_LINUX) {
      // Try lscpu first (like bash script)
      try {
        const lscpu = execCommand('lscpu');
        const modelMatch = lscpu.match(/Model name:\s*([^\n,]+)/);
        if (modelMatch) {
          cpuName = modelMatch[1].trim();
        }
      } catch { }

      // Fallback to /proc/cpuinfo (like bash script)
      if (!cpuName) {
        try {
          const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
          const modelMatch = cpuInfo.match(/model name\s*:\s*([^\n]+)/);
          const hardwareMatch = cpuInfo.match(/Hardware\s*:\s*([^\n]+)/);

          if (modelMatch) {
            cpuName = modelMatch[1].trim();
          } else if (hardwareMatch) {
            cpuName = hardwareMatch[1].trim();
          }
        } catch { }
      }
    } else {
      // Use Node.js os module for other platforms
      const cpus = os.cpus();
      if (cpus.length > 0) {
        cpuName = cpus[0].model.trim().replace(/[\r\n]+/g, ' ');
      }
    }

    if (!cpuName) {
      setCachedValue(this.cache, 'cpu', '');
      return '';
    }

    //remove "with ..." from cpuName
    cpuName = cpuName.trim().replace(/with .*/, '');

    const color = colors[settings.colors.cpu] || colors.orange;
    const emoji = settings.display.show_emojis ? '📈 ' : '';
    const result = `${color}${emoji}${cpuName}`;
    setCachedValue(this.cache, 'cpu', result);
    return result;
  },

  gpu(settings) {
    const cached = getCachedValue(this.cache, 'gpu', settings);
    if (cached) return cached;

    if (IS_WINDOWS) {
      try {
        // Get GPU information using WMIC
        const wmic = execCommand('wmic path win32_VideoController get name /format:list');
        const nameMatch = wmic.match(/Name=(.+)/);
        if (nameMatch) {
          const gpu = nameMatch[1].trim();
          if (gpu && gpu !== '' && !gpu.includes('Microsoft Basic')) {
            const color = colors[settings.colors.gpu] || colors.yellow;
            const emoji = settings.display.show_emojis ? '🎮 ' : '';
            const result = `${color}${emoji}${gpu}`;
            setCachedValue(this.cache, 'gpu', result);
            return result;
          }
        }
      } catch { }

      // Fallback using PowerShell
      try {
        const ps = execCommand('powershell.exe -Command "Get-WmiObject -Class Win32_VideoController | Where-Object {$_.Name -notlike \'*Microsoft Basic*\'} | Select-Object -First 1 -ExpandProperty Name"');
        if (ps.trim()) {
          const gpu = ps.trim();
          const color = colors[settings.colors.gpu] || colors.yellow;
          const emoji = settings.display.show_emojis ? '🎮 ' : '';
          const result = `${color}${emoji}${gpu}`;
          setCachedValue(this.cache, 'gpu', result);
          return result;
        }
      } catch { }
    } else if (IS_LINUX) {
      try {
        const lspci = execCommand('lspci');
        // Look for VGA and specific GPU brands like the bash script
        const gpuMatch = lspci.match(/VGA.*?(RTX|GeForce|AMD|Intel|NVIDIA)[^\n]*/i);
        if (gpuMatch) {
          let gpu = gpuMatch[0];

          // Try to extract clean GPU name from brackets like bash script
          const bracketMatch = gpu.match(/\[([^\]]+)\]/);
          if (bracketMatch) {
            gpu = bracketMatch[1];
          } else {
            // Fallback: clean up the string
            gpu = gpu.replace(/^.*VGA[^:]*:\s*/, '').replace(/\s*\(.*\)$/, '').trim();
          }

          if (gpu) {
            const color = colors[settings.colors.gpu] || colors.yellow;
            const emoji = settings.display.show_emojis ? '🎮 ' : '';
            const result = `${color}${emoji}${gpu}`;
            setCachedValue(this.cache, 'gpu', result);
            return result;
          }
        }
      } catch { }
    }

    setCachedValue(this.cache, 'gpu', '');
    return '';
  },

  disk_used(settings) {
    const cached = getCachedValue(this.cache, 'disk_used', settings);
    if (cached) return cached;

    if (IS_WINDOWS) {
      // try {
      //   // Get disk usage for C: drive using PowerShell
      //   const ps = execCommand('powershell.exe -Command "Get-WmiObject -Class Win32_LogicalDisk -Filter \'DeviceID="C:"\' | Select-Object @{Name=\'PercentFree\';Expression={[math]::Round((($_.FreeSpace / $_.Size) * 100), 0)}} | Select-Object -ExpandProperty PercentFree"');
      //   if (ps.trim()) {
      //     const percentFree = parseInt(ps.trim());
      //     const percentUsed = 100 - percentFree;
      //     const color = colors[settings.colors.disk_used] || colors.purple;
      //     const emoji = settings.display.show_emojis ? '📁 ' : '';
      //     const result = `${color}${emoji}${percentUsed}%`;
      //     setCachedValue(this.cache, 'disk_used', result);
      //     return result;
      //   }
      // } catch {}

      // // Fallback using WMIC
      // try {
      //   const wmic = execCommand('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:list');
      //   const sizeMatch = wmic.match(/Size=(\d+)/);
      //   const freeMatch = wmic.match(/FreeSpace=(\d+)/);

      //   if (sizeMatch && freeMatch) {
      //     const size = parseInt(sizeMatch[1]);
      //     const free = parseInt(freeMatch[1]);
      //     const used = size - free;
      //     const percentUsed = Math.round((used / size) * 100);
      //     const color = colors[settings.colors.disk_used] || colors.purple;
      //     const emoji = settings.display.show_emojis ? '📁 ' : '';
      //     const result = `${color}${emoji}${percentUsed}%`;
      //     setCachedValue(this.cache, 'disk_used', result);
      //     return result;
      //   }
      // } catch {}
    } else if (IS_LINUX) {
      try {
        const df = execCommand('df -h');
        let diskUsage = '';

        // Check for Android storage first
        if (df.includes('/storage/emulated')) {
          const match = df.match(/\s+(\d+%)\s+\/storage\/emulated/);
          diskUsage = match ? match[1] : '';
        } else {
          // Check for root filesystem - look for lines ending with exactly " /"
          const lines = df.split('\n');
          for (const line of lines) {
            if (line.trim().endsWith(' /')) {
              const parts = line.trim().split(/\s+/);
              // Find the percentage column (should contain %)
              const percentIndex = parts.findIndex(part => part.includes('%'));
              if (percentIndex !== -1) {
                diskUsage = parts[percentIndex];
                break;
              }
            }
          }

          // Fallback: look for any line with root mount point
          if (!diskUsage) {
            const rootMatch = df.match(/(\d+%)\s+\/\s*$/m);
            diskUsage = rootMatch ? rootMatch[1] : '';
          }
        }

        if (diskUsage) {
          const color = colors[settings.colors.disk_used] || colors.purple;
          const emoji = settings.display.show_emojis ? '📁 ' : '';
          const result = `${color}${emoji}${diskUsage}`;
          setCachedValue(this.cache, 'disk_used', result);
          return result;
        }
      } catch { }
    }

    setCachedValue(this.cache, 'disk_used', '');
    return '';
  },

  ram_used(settings) {
    const cached = getCachedValue(this.cache, 'ram_used', settings);
    if (cached) return cached;

    if (IS_LINUX) {
      // Use /proc/meminfo for more accurate Linux memory info like bash script
      try {
        const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
        const totalMatch = meminfo.match(/MemTotal:\s+(\d+) kB/);
        const freeMatch = meminfo.match(/MemFree:\s+(\d+) kB/);

        if (totalMatch && freeMatch) {
          const totalMB = Math.round(parseInt(totalMatch[1]) / 1024);
          const freeMB = Math.round(parseInt(freeMatch[1]) / 1024);
          const usedMB = totalMB - freeMB;

          const totalGB = Math.round(totalMB / 1024);
          const usedGB = Math.round(usedMB / 1024);

          const color = colors[settings.colors.ram_used] || colors.yellow;
          const emoji = settings.display.show_emojis ? '💾 ' : '';
          const result = `${color}${emoji}${usedGB}/${totalGB}GB`;
          setCachedValue(this.cache, 'ram_used', result);
          return result;
        }
      } catch { }
    }

    // Fallback to Node.js os module
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const totalGB = Math.round(totalMem / (1024 * 1024 * 1024));
    const usedGB = Math.round(usedMem / (1024 * 1024 * 1024));

    const color = colors[settings.colors.ram_used] || colors.yellow;
    const emoji = settings.display.show_emojis ? '💾 ' : '';
    const result = `${color}${emoji}${usedGB}/${totalGB}GB`;
    setCachedValue(this.cache, 'ram_used', result);
    return result;
  },

  top_process(settings) {
    const cached = getCachedValue(this.cache, 'top_process', settings);
    if (cached) return cached;

    if (IS_LINUX) {
      try {
        const ps = execCommand('ps -eo pcpu,comm --sort=-%cpu --no-headers');
        const lines = ps.split('\n');
        if (lines.length > 0) {
          const topProcess = lines[0].trim().replace(/\s+/, ' ').split(' ');
          const cpu = topProcess[0].replace(/\.\d+/, '%');
          const process = topProcess[1].split('/').pop();
          const color = colors[settings.colors.top_process] || colors.magenta;
          const emoji = settings.display.show_emojis ? '🔝 ' : '';
          const result = `${color}${emoji}${cpu} ${process}`;
          setCachedValue(this.cache, 'top_process', result);
          return result;
        }
      } catch { }
    }

    setCachedValue(this.cache, 'top_process', '');
    return '';
  },

  uptime(settings) {
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    const color = colors[settings.colors.uptime] || colors.cyan;
    const emoji = settings.display.show_emojis ? '⏱️  ' : '';
    return `${color}${emoji}${days}d ${hours}h ${minutes}m`;
  },

  device(settings) {
    const cached = getCachedValue(this.cache, 'device', settings);
    if (cached) return cached;

    if (IS_WINDOWS) {
      try {
        // Get computer model using WMIC
        const wmic = execCommand('wmic csproduct get name /format:list');
        const nameMatch = wmic.match(/Name=(.+)/);
        if (nameMatch) {
          const device = nameMatch[1].trim();
          if (device && device !== '') {
            const color = colors[settings.colors.device] || colors.blue;
            const emoji = settings.display.show_emojis ? '💻 ' : '';
            const result = `${color}${emoji}${device}`;
            setCachedValue(this.cache, 'device', result);
            return result;
          }
        }
      } catch { }

      // Fallback using PowerShell
      try {
        const ps = execCommand('powershell.exe -Command "Get-WmiObject -Class Win32_ComputerSystem | Select-Object -ExpandProperty Model"');
        if (ps.trim()) {
          const device = ps.trim();
          const color = colors[settings.colors.device] || colors.blue;
          const emoji = settings.display.show_emojis ? '💻 ' : '';
          const result = `${color}${emoji}${device}`;
          setCachedValue(this.cache, 'device', result);
          return result;
        }
      } catch { }
    } else if (IS_LINUX) {
      try {
        // Check for Android
        if (commandExists('getprop')) {
          const device = execCommand('getprop ro.product.model');
          if (device) {
            const color = colors[settings.colors.device] || colors.blue;
            const emoji = settings.display.show_emojis ? '💻 ' : '';
            const result = `${color}${emoji}${device}`;
            setCachedValue(this.cache, 'device', result);
            return result;
          }
        }

        // Check for DMI info
        const dmiPath = '/sys/devices/virtual/dmi/id/product_name';
        if (fs.existsSync(dmiPath)) {
          const device = fs.readFileSync(dmiPath, 'utf8').trim();
          if (device) {
            const color = colors[settings.colors.device] || colors.blue;
            const emoji = settings.display.show_emojis ? '💻 ' : '';
            const result = `${color}${emoji}${device}`;
            setCachedValue(this.cache, 'device', result);
            return result;
          }
        }
      } catch { }
    }

    setCachedValue(this.cache, 'device', '');
    return '';
  },

  kernel(settings) {
    const cached = getCachedValue(this.cache, 'kernel', settings);
    if (cached) return cached;

    const kernel = os.release();
    const color = colors[settings.colors.kernel] || colors.green;
    const emoji = settings.display.show_emojis ? '🔧 ' : '';
    const result = `${color}${emoji}${kernel}`;
    setCachedValue(this.cache, 'kernel', result);
    return result;
  },

  shell(settings) {
    if (IS_LINUX) {
      try {
        const ppid = process.ppid;
        const shell = execCommand(`ps -p ${ppid} -o comm=`).split('/').pop();
        const color = colors[settings.colors.shell] || colors.orange;
        const emoji = settings.display.show_emojis ? '🐚 ' : '';
        return `${color}${emoji}${shell}`;
      } catch { }
    }
    return '';
  },

  pacman(settings) {
    const cached = getCachedValue(this.cache, 'pacman', settings);
    if (cached) return cached;

    const commands = ['apt', 'npm', 'uv', 'docker', 'hx', 'nvim', 'bun', 'yay',
      'pacman', 'yum', 'dnf', 'zypper', 'emerge', 'apk', 'snap', 'flatpak'];
    const available = commands.filter(cmd => commandExists(cmd));

    if (available.length === 0) {
      setCachedValue(this.cache, 'pacman', '');
      return '';
    }

    const color = colors[settings.colors.pacman] || colors.cyan;
    const emoji = settings.display.show_emojis ? '🚀 ' : '';
    const result = `${color}${emoji}${available.join(' ')}`;
    setCachedValue(this.cache, 'pacman', result);
    return result;
  },

  ports(settings) {
    const cached = getCachedValue(this.cache, 'ports', settings);
    if (cached) return cached;

    if (IS_LINUX) {
      try {
        const lsof = execCommand('lsof -nP -iTCP -sTCP:LISTEN');
        const lines = lsof.split('\n').slice(1); // Skip header
        const ports = new Set();

        lines.forEach(line => {
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

        if (ports.size > 0) {
          const portList = Array.from(ports);
          const emoji = settings.display.show_emojis ? '🔌 ' : '';
          let output = ` ${emoji}`;

          if (settings.colors.ports === 'multicolor') {
            const colorCodes = [31, 32, 33, 34, 35, 36]; // Red, Green, Yellow, Blue, Magenta, Cyan
            portList.forEach((port, index) => {
              const color = colorCodes[index % colorCodes.length];
              output += `\x1b[${color}m${port}\x1b[0m `;
            });
          } else {
            const color = colors[settings.colors.ports] || colors.cyan;
            output = `${color}${emoji}${portList.join(' ')}`;
          }

          const result = output.trim();
          setCachedValue(this.cache, 'ports', result);
          return result;
        }
      } catch { }
    }

    setCachedValue(this.cache, 'ports', '');
    return '';
  },

  containers(settings) {
    const cached = getCachedValue(this.cache, 'containers', settings);
    if (cached) return cached;

    if (!commandExists('docker')) {
      setCachedValue(this.cache, 'containers', '');
      return '';
    }

    try {
      const containerCount = execCommand('docker ps -q').split('\n').filter(line => line.trim()).length;
      if (containerCount === 0) {
        setCachedValue(this.cache, 'containers', '');
        return '';
      }

      const containers = execCommand('docker ps --format "{{.Names}}\t{{.Ports}}"');
      const lines = containers.split('\n').filter(line => line.trim());

      const emoji = settings.display.show_emojis ? '📦' : '';
      const color = colors[settings.colors.containers] || colors.green;
      let output = ` ${color}${emoji}\x1b[0m`;

      lines.forEach(line => {
        const [name, ports] = line.split('\t');
        if (name) {
          output += ` ${color}${name}\x1b[0m`;

          if (ports) {
            const portMatches = ports.match(/->(\d+(-\d+)?)\//g);
            if (portMatches) {
              const uniquePorts = [...new Set(portMatches.map(p => p.replace(/->\d+(-\d+)?\//, '')))];
              uniquePorts.forEach(port => {
                output += ` \x1b[33m${port}\x1b[0m`;
              });
            }
          }
        }
      });

      setCachedValue(this.cache, 'containers', output);
      return output;
    } catch { }

    setCachedValue(this.cache, 'containers', '');
    return '';
  },

  // Additional Linux system info functions
  memory_available(settings) {
    if (!IS_LINUX) return '';

    try {
      const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
      const availableMatch = meminfo.match(/MemAvailable:\s+(\d+) kB/);
      if (availableMatch) {
        const availableGB = Math.round(parseInt(availableMatch[1]) / 1024 / 1024);
        const color = colors[settings.colors.memory_available] || colors.blue;
        const emoji = settings.display.show_emojis ? '🧠 ' : '';
        return `${color}${emoji}${availableGB}GB available`;
      }
    } catch { }
    return '';
  },

  swap_used(settings) {
    if (!IS_LINUX) return '';

    try {
      const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
      const swapTotalMatch = meminfo.match(/SwapTotal:\s+(\d+) kB/);
      const swapFreeMatch = meminfo.match(/SwapFree:\s+(\d+) kB/);

      if (swapTotalMatch && swapFreeMatch) {
        const swapTotal = parseInt(swapTotalMatch[1]);
        const swapFree = parseInt(swapFreeMatch[1]);
        const swapUsed = swapTotal - swapFree;

        if (swapTotal > 0) {
          const swapUsedPercent = Math.round((swapUsed / swapTotal) * 100);
          const swapUsedMB = Math.round(swapUsed / 1024);
          const color = colors[settings.colors.swap_used] || colors.purple;
          const emoji = settings.display.show_emojis ? '🔄 ' : '';
          return `${color}${emoji}${swapUsedPercent}% (${swapUsedMB}MB) swap`;
        }
      }
    } catch { }
    return '';
  },

  load_average(settings) {
    if (!IS_LINUX) return '';

    try {
      const loadavg = fs.readFileSync('/proc/loadavg', 'utf8');
      const loads = loadavg.split(' ').slice(0, 3);
      const color = colors[settings.colors.load_average] || colors.red;
      const emoji = settings.display.show_emojis ? '⚖️ ' : '';
      return `${color}${emoji}${loads.join(' ')}`;
    } catch { }
    return '';
  },

  users_logged_in(settings) {
    if (!IS_LINUX) return '';

    try {
      const who = execCommand('who');
      const users = who.split('\n').filter(line => line.trim()).length;
      if (users > 0) {
        const color = colors[settings.colors.users_logged_in] || colors.cyan;
        const emoji = settings.display.show_emojis ? '👥 ' : '';
        return `${color}${emoji}${users} users`;
      }
    } catch { }
    return '';
  },

  network_interfaces(settings) {
    const cached = getCachedValue(this.cache, 'network_interfaces', settings);
    if (cached) return cached;

    if (!IS_LINUX) {
      setCachedValue(this.cache, 'network_interfaces', '');
      return '';
    }

    try {
      const interfaces = os.networkInterfaces();
      const activeInterfaces = [];

      for (const [name, addrs] of Object.entries(interfaces)) {
        if (name !== 'lo') { // Skip loopback
          const ipv4Addr = addrs.find(addr => addr.family === 'IPv4' && !addr.internal);
          if (ipv4Addr) {
            activeInterfaces.push(name);
          }
        }
      }

      if (activeInterfaces.length > 0) {
        const color = colors[settings.colors.network_interfaces] || colors.yellow;
        const emoji = settings.display.show_emojis ? '🌐 ' : '';
        const result = `${color}${emoji}${activeInterfaces.join(' ')}`;
        setCachedValue(this.cache, 'network_interfaces', result);
        return result;
      }
    } catch { }

    setCachedValue(this.cache, 'network_interfaces', '');
    return '';
  },

  mount_points(settings) {
    const cached = getCachedValue(this.cache, 'mount_points', settings);
    if (cached) return cached;

    if (!IS_LINUX) {
      setCachedValue(this.cache, 'mount_points', '');
      return '';
    }

    try {
      const df = execCommand('df -h');
      const lines = df.split('\n').slice(1); // Skip header
      const mountPoints = [];

      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          const mountPoint = parts[5];
          const usage = parts[4];
          if (!mountPoint.startsWith('/dev') && !mountPoint.startsWith('/proc') &&
            !mountPoint.startsWith('/sys') && mountPoint !== '/') {
            mountPoints.push(`${mountPoint}(${usage})`);
          }
        }
      });

      if (mountPoints.length > 0) {
        const color = colors[settings.colors.mount_points] || colors.gray;
        const emoji = settings.display.show_emojis ? '📂 ' : '';
        const result = `${color}${emoji}${mountPoints.slice(0, 3).join(' ')}`;
        setCachedValue(this.cache, 'mount_points', result);
        return result;
      }
    } catch { }

    setCachedValue(this.cache, 'mount_points', '');
    return '';
  },

  services_running(settings) {
    const cached = getCachedValue(this.cache, 'services_running', settings);
    if (cached) return cached;

    if (!IS_LINUX) {
      setCachedValue(this.cache, 'services_running', '');
      return '';
    }

    try {
      let serviceCount = 0;

      // Try systemctl first
      if (commandExists('systemctl')) {
        const services = execCommand('systemctl list-units --type=service --state=running --no-pager');
        serviceCount = services.split('\n').filter(line => line.includes('.service')).length;
      } else if (commandExists('service')) {
        // Fallback for older systems
        const services = execCommand('service --status-all');
        serviceCount = services.split('\n').filter(line => line.includes('+')).length;
      }

      if (serviceCount > 0) {
        const color = colors[settings.colors.services_running] || colors.green;
        const emoji = settings.display.show_emojis ? '⚙️ ' : '';
        const result = `${color}${emoji}${serviceCount} services`;
        setCachedValue(this.cache, 'services_running', result);
        return result;
      }
    } catch { }

    setCachedValue(this.cache, 'services_running', '');
    return '';
  },

  temperature(settings) {
    const cached = getCachedValue(this.cache, 'temperature', settings);
    if (cached) return cached;

    if (!IS_LINUX) {
      setCachedValue(this.cache, 'temperature', '');
      return '';
    }

    try {
      // Try different temperature sources
      const tempSources = [
        '/sys/class/thermal/thermal_zone0/temp',
        '/sys/class/hwmon/hwmon0/temp1_input',
        '/sys/class/hwmon/hwmon1/temp1_input'
      ];

      for (const source of tempSources) {
        if (fs.existsSync(source)) {
          const temp = fs.readFileSync(source, 'utf8').trim();
          const tempC = Math.round(parseInt(temp) / 1000);

          if (tempC > 0 && tempC < 150) { // Reasonable temperature range
            const color = tempC > 70 ? colors.red : tempC > 50 ? colors.yellow : colors.green;
            const emoji = settings.display.show_emojis ? '🌡️ ' : '';
            const result = `${color}${emoji}${tempC}°C`;
            setCachedValue(this.cache, 'temperature', result);
            return result;
          }
        }
      }
    } catch { }

    setCachedValue(this.cache, 'temperature', '');
    return '';
  },

  battery(settings) {
    const cached = getCachedValue(this.cache, 'battery', settings);
    if (cached) return cached;

    if (!IS_LINUX) {
      setCachedValue(this.cache, 'battery', '');
      return '';
    }

    try {
      const batteryPath = '/sys/class/power_supply/BAT0';
      const capacityPath = `${batteryPath}/capacity`;
      const statusPath = `${batteryPath}/status`;

      if (fs.existsSync(capacityPath)) {
        const capacity = fs.readFileSync(capacityPath, 'utf8').trim();
        const status = fs.existsSync(statusPath) ?
          fs.readFileSync(statusPath, 'utf8').trim() : 'Unknown';

        const batteryPercent = parseInt(capacity);
        const isCharging = status === 'Charging';
        const color = batteryPercent < 20 ? colors.red :
          batteryPercent < 50 ? colors.yellow : colors.green;
        const emoji = settings.display.show_emojis ?
          (isCharging ? '🔌 ' : '🔋 ') : '';
        const result = `${color}${emoji}${batteryPercent}%${isCharging ? '+' : ''}`;
        setCachedValue(this.cache, 'battery', result);
        return result;
      }
    } catch { }

    setCachedValue(this.cache, 'battery', '');
    return '';
  },

  screen_resolution(settings) {
    if (!IS_LINUX) return '';

    try {
      if (process.env.DISPLAY) {
        const xrandr = execCommand('xrandr');
        const resolutionMatch = xrandr.match(/(\d+x\d+)\+\d+\+\d+/);
        if (resolutionMatch) {
          const color = colors[settings.colors.screen_resolution] || colors.blue;
          const emoji = settings.display.show_emojis ? '🖥️ ' : '';
          return `${color}${emoji}${resolutionMatch[1]}`;
        }
      }
    } catch { }
    return '';
  }
};

// Main function to display system info
async function displaySystemInfo(customDisplayOrder = null) {
  const settings = loadSettings();
  const cache = loadCache();
  const context = { cache, settings };

  // Use custom display order if provided, otherwise use settings
  const displayOrder = customDisplayOrder || settings.display_order;

  // Check if we need IP info and it's not cached
  const allKeys = displayOrder.flat();
  const needIPInfo = allKeys.some(key => ['ip', 'isp', 'domain', 'city'].includes(key));
  const cachedIPInfo = getCachedValue(cache, 'ipInfo', settings);

  if (needIPInfo && !cachedIPInfo) {
    context.ipInfo = await fetchIPInfo(settings);
    setCachedValue(cache, 'ipInfo', context.ipInfo);
  } else if (needIPInfo && cachedIPInfo) {
    context.ipInfo = cachedIPInfo;
  }

  // If single line mode is enabled, flatten everything into one line
  if (settings.display.single_line) {
    const allItems = [];

    for (const group of displayOrder) {
      for (const key of group) {
        if (infoFunctions[key]) {
          try {
            const info = await infoFunctions[key].call(context, settings);
            if (info && info.trim()) {
              allItems.push(info);
            }
          } catch (error) {
            if (settings.advanced.debug) {
              console.error(`Error getting ${key}:`, error.message);
            }
          }
        }
      }
    }

    if (allItems.length > 0) {
      const singleLine = allItems.join(' ');
      console.log(singleLine + colors.reset);
    }

    // Save cache and return early
    saveCache(cache);
    return;
  }

  // Normal multi-line grouped display with intelligent wrapping
  const lines = [];
  let currentLine = '';
  const maxLineLength = settings.display.line_wrap_length || 120;

  for (const group of displayOrder) {
    for (const key of group) {
      if (infoFunctions[key]) {
        try {
          const info = await infoFunctions[key].call(context, settings);
          if (info && info.trim()) {
            // Remove ANSI color codes to get actual text length
            const infoLength = info.replace(/\x1b\[[0-9;]*m/g, '').length;
            const currentLineLength = currentLine.replace(/\x1b\[[0-9;]*m/g, '').length;

            // If adding this item would exceed the line length, start a new line
            if (currentLine && (currentLineLength + infoLength + 1) > maxLineLength) {
              lines.push(currentLine);
              currentLine = info;
            } else {
              // Add to current line
              if (currentLine) {
                currentLine += ' ' + info;
              } else {
                currentLine = info;
              }
            }
          }
        } catch (error) {
          if (settings.advanced.debug) {
            console.error(`Error getting ${key}:`, error.message);
          }
        }
      } else if (settings.advanced.debug) {
        console.error(`Unknown info function: ${key}`);
      }
    }
  }

  // Add the last line if it has content
  if (currentLine) {
    lines.push(currentLine);
  }

  // Show offline message if no network and IP info was requested but failed
  if (needIPInfo && (!context.ipInfo || Object.keys(context.ipInfo).length === 0) &&
    settings.network.show_offline_message && lines.length === 0) {
    const emoji = settings.display.show_emojis ? '❌ ' : '';
    lines.push(`${colors.red}${emoji}No internet connection`);
  }

  // Save cache after all operations
  saveCache(cache);

  // Output each line
  if (lines.length > 0) {
    lines.forEach(line => {
      console.log(line + colors.reset);
    });
  } else if (settings.advanced.debug) {
    console.log('No system information could be displayed');
  }
}

// Settings management commands
function handleSettingsCommand(args) {
  const settings = loadSettings();

  if (args.includes('--settings-init')) {
    if (saveSettings(DEFAULT_SETTINGS)) {
      console.log('Settings initialized with defaults');
    } else {
      console.log('Failed to initialize settings');
    }
    return true;
  }

  if (args.includes('--settings-show')) {
    console.log('Current settings:');
    console.log(JSON.stringify(settings, null, 2));
    return true;
  }

  if (args.includes('--settings-reset')) {
    if (saveSettings(DEFAULT_SETTINGS)) {
      console.log('Settings reset to defaults');
    } else {
      console.log('Failed to reset settings');
    }
    return true;
  }

  const cacheResetIndex = args.indexOf('--refresh');
  if (cacheResetIndex !== -1) {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
      }
    } catch (error) {
      console.error('Error clearing cache:', error.message);
    }
  }

  const setIndex = args.indexOf('--set');
  if (setIndex !== -1 && args[setIndex + 1] && args[setIndex + 2]) {
    const key = args[setIndex + 1];
    const value = args[setIndex + 2];

    try {
      // Parse JSON value if it looks like JSON
      const parsedValue = value.startsWith('{') || value.startsWith('[') ?
        JSON.parse(value) : value;

      // Set nested property using dot notation
      const keys = key.split('.');
      let current = settings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = parsedValue;

      if (saveSettings(settings)) {
        console.log(`Setting ${key} = ${value}`);
      } else {
        console.log('Failed to save settings');
      }
    } catch (error) {
      console.error('Error setting value:', error.message);
    }
    return true;
  }

  return false;
}

// Installation function - Cross-platform compatible
function installShellGreeting() {
  const homeDir = os.homedir();

  let configDir, scriptPath;
  if (IS_WINDOWS) {
    configDir = path.join(homeDir, 'AppData', 'Local');
    scriptPath = path.join(configDir, 'systeminfo.js');
  } else {
    configDir = path.join(homeDir, '.config');
    scriptPath = path.join(configDir, 'systeminfo.js');
  }

  const currentScript = path.resolve(__filename);

  try {
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Copy this script
    fs.copyFileSync(currentScript, scriptPath);
    if (!IS_WINDOWS) {
      fs.chmodSync(scriptPath, '755');
    }

    if (IS_WINDOWS) {
      // Windows-specific installation
      console.log('Windows installation:');
      console.log('1. Script copied to:', scriptPath);
      console.log('2. To add to PowerShell profile, run:');
      console.log(`   Add-Content $PROFILE "node '${scriptPath}'"`);
      console.log('3. To add to Command Prompt, create a batch file in your startup folder');

      const startupBat = path.join(configDir, 'systeminfo-startup.bat');
      fs.writeFileSync(startupBat, `@echo off\nnode "${scriptPath}"\n`);
      console.log('4. Batch file created:', startupBat);

    } else {
      // Unix-like installation

      // Silence default login messages
      try {
        const hushLoginPath = path.join(homeDir, '.hushlogin');
        fs.writeFileSync(hushLoginPath, '');
      } catch {
        // Ignore permission errors
      }

      // Add to bash
      const bashrcPath = path.join(homeDir, '.bashrc');
      const bashLine = `node ${scriptPath}`;

      if (fs.existsSync(bashrcPath)) {
        const bashrc = fs.readFileSync(bashrcPath, 'utf8');
        if (!bashrc.includes('systeminfo.js')) {
          fs.appendFileSync(bashrcPath, `\n${bashLine}\n`);
        }
      } else {
        fs.writeFileSync(bashrcPath, `${bashLine}\n`);
      }

      // Add to zsh (common on Mac)
      const zshrcPath = path.join(homeDir, '.zshrc');
      if (fs.existsSync(zshrcPath)) {
        const zshrc = fs.readFileSync(zshrcPath, 'utf8');
        if (!zshrc.includes('systeminfo.js')) {
          fs.appendFileSync(zshrcPath, `\n${bashLine}\n`);
        }
      }

      // Add to fish if config exists
      const fishConfigPath = path.join(homeDir, '.config', 'fish', 'config.fish');
      if (fs.existsSync(fishConfigPath)) {
        const fishConfig = fs.readFileSync(fishConfigPath, 'utf8');
        if (!fishConfig.includes('systeminfo.js')) {
          fs.appendFileSync(fishConfigPath, `\nset -U fish_greeting ""\n${bashLine}\n`);
        }
      }

      // Add to nushell if config exists
      const nushellConfigPath = path.join(homeDir, '.config', 'nushell', 'config.nu');
      if (fs.existsSync(nushellConfigPath)) {
        const nushellConfig = fs.readFileSync(nushellConfigPath, 'utf8');
        if (!nushellConfig.includes('systeminfo.js')) {
          fs.appendFileSync(nushellConfigPath, `\n$env.config.show_banner = false\n${bashLine}\n`);
        }
      }
    }

    console.log('Shell greeting installation completed!');

  } catch (error) {
    console.error('Error installing shell greeting:', error.message);
    process.exit(1);
  }
}

// Parse CLI mode arguments (comma-separated parts)
function parseCLIMode(args) {
  // Look for arguments that don't start with -- and contain commas
  for (const arg of args) {
    if (!arg.startsWith('--') && arg.includes(',')) {
      return arg.split(',').map(part => part.trim()).filter(part => part.length > 0);
    }
  }

  // Look for single part arguments (no comma)
  for (const arg of args) {
    if (!arg.startsWith('--') && !arg.includes('=') && arg.length > 0) {
      return [arg.trim()];
    }
  }

  return null;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Handle settings commands
  if (handleSettingsCommand(args)) {
    return;
  }

  // Check for CLI mode (specific parts requested)
  const cliParts = parseCLIMode(args);
  if (cliParts) {
    // Validate that all requested parts exist
    const validParts = cliParts.filter(part => infoFunctions[part]);
    const invalidParts = cliParts.filter(part => !infoFunctions[part]);

    if (invalidParts.length > 0) {
      console.error(`Invalid parts: ${invalidParts.join(', ')}`);
      console.error(`Available parts: ${Object.keys(infoFunctions).join(', ')}`);
      process.exit(1);
    }

    if (validParts.length === 0) {
      console.error('No valid parts specified');
      process.exit(1);
    }

    // Create custom display order with the requested parts
    const customDisplayOrder = [validParts];
    await displaySystemInfo(customDisplayOrder);
    return;
  }

  // Check for --install argument
  if (args.includes('--install')) {
    installShellGreeting();
    return;
  }

  // Check for --single-line argument
  if (args.includes('--single-line')) {
    const settings = loadSettings();
    settings.display.single_line = true;
    await displaySystemInfo();
    return;
  }

  // Check for --multi-line argument
  if (args.includes('--multi-line')) {
    const settings = loadSettings();
    settings.display.single_line = false;
    await displaySystemInfo();
    return;
  }

  // Check for --help argument
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
System Info Script - Node.js Version

Usage:
  node systeminfo.js [options]
  node systeminfo.js <part1,part2,...>    # CLI mode: show specific parts only

Options:
  --help, -h           Show this help message
  --install            Install as shell greeting
  --settings-init      Initialize settings file with defaults
  --settings-show      Display current settings
  --settings-reset     Reset settings to defaults
  --refresh        Clear the cache file
  --set <key> <value>  Set a configuration value (use dot notation)

Examples:
  node systeminfo.js                      # Show all info (default)
  node systeminfo.js cpu,os               # Show only CPU and OS info
  node systeminfo.js user,hostname,ip     # Show user, hostname, and IP
  node systeminfo.js disk_used            # Show only disk usage
  node systeminfo.js --install
  node systeminfo.js --set display.show_emojis false
  node systeminfo.js --set colors.user blue
  node systeminfo.js --set display_order '[["user","hostname"],["disk_used","ram_used"]]'

Settings file: ${SETTINGS_FILE}
Cache file: ${CACHE_FILE}

Platform: ${IS_WINDOWS ? 'Windows' : IS_MAC ? 'macOS' : IS_LINUX ? 'Linux' : 'Unknown'}

Available display blocks:
  Basic: user, hostname, uptime, shell, os, kernel, device
  Resources: disk_used, ram_used, memory_available, swap_used, top_process
  Network: ip, iplocal, city, domain, isp, network_interfaces
  Hardware: cpu, gpu, temperature, battery, screen_resolution
  System: load_average, users_logged_in, mount_points, services_running
  Tools: pacman, ports, containers

Available colors:
  red, orange, yellow, green, blue, cyan, purple, magenta, gray, lightblue
  (use "multicolor" for ports to get rainbow effect)

Display Format:
  Default: Single-line output with all information on one continuous line
  👤 user 🏠 hostname ⚡ OS 📈 CPU 🎮 GPU 💻 device 🔧 kernel 📁 90% 💾 2GB ...

  Multi-line Mode: Use --multi-line or --set display.single_line false
  Intelligent line wrapping breaks lines at ~100 characters (configurable):
  - Respects word boundaries and doesn't break in the middle of items
  - Dynamically arranges items based on actual character length
  - Ignores ANSI color codes when calculating line length
  
  Configure line wrap length: --set display.line_wrap_length 80

  To customize item order, modify display_order as an array of arrays:
  --set display_order '[["user","hostname","os"],["disk_used","ram_used"],["ip","city"],["shell","pacman"]]'

Linux-specific features:
  - Temperature monitoring from thermal zones
  - Battery status and charging indication
  - System load averages
  - Swap usage monitoring
  - Active service count
  - Mount point information
  - Memory availability from /proc/meminfo
  - Screen resolution via xrandr
`);
    return;
  }

  // Display system info
  await displaySystemInfo();
}

// Run the script
// if (import.meta.url === `file://${process.argv[1]}`) {
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
// }

export { displaySystemInfo, installShellGreeting };