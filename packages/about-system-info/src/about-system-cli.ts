#!/usr/bin/env node
import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getSystemInfo } from "./system-info-api";
import type { SystemInfo, SystemInfoOptions } from "./systeminfo-types";

const __filename = fileURLToPath(import.meta.url);

import {
  Settings,
  DEFAULT_SETTINGS,
  colors,
  SETTINGS_FILE,
  CACHE_FILE,
  loadSettings,
  saveSettings,
} from "./info/settings";

// Platform detection
const IS_WINDOWS = os.platform() === "win32";

function formatValue(key: string, value: string, settings: Settings): string {
  if (!value || value.trim() === "") return "";

  const color =
    colors[settings.colors[key] as keyof typeof colors] || colors.reset;
  const emoji = settings.display.show_emojis ? settings.emojis[key] || "" : "";

  // Special handling for battery emoji
  if (key === "battery" && settings.display.show_emojis) {
    const batteryEmoji = value.includes("+")
      ? settings.emojis.battery_charging
      : settings.emojis.battery;
    return `${color}${batteryEmoji}${value}`;
  }

  // Multicolor handling for ports
  if (key === "ports" && settings.colors[key] === "multicolor" && value) {
    const emoji = settings.display.show_emojis ? settings.emojis.ports : "";
    let output = ` ${emoji}`;
    const ports = value.split(" ");
    const colorCodes = [31, 32, 33, 34, 35, 36];
    ports.forEach((port, index) => {
      const colorCode = colorCodes[index % colorCodes.length];
      output += `\x1b[${colorCode}m${port}\x1b[0m `;
    });
    return output.trim();
  }

  // Multicolor handling for pacman
  if (key === "pacman" && settings.colors[key] === "multicolor" && value) {
    const emoji = settings.display.show_emojis ? settings.emojis.pacman : "";
    return `${color}${emoji}${value}`;
  }

  return `${color}${emoji}${value}`;
}

function removeAnsiCodes(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

async function displaySystemInfo(
  customDisplayOrder: string[][] | null = null
): Promise<void> {
  const settings = loadSettings();
  const displayOrder = customDisplayOrder || settings.display_order;

  // Get system info
  const info = await getSystemInfo();

  // Single line mode
  if (settings.display.single_line) {
    const allItems: string[] = [];

    for (const group of displayOrder) {
      for (const key of group) {
        const value = info[key as keyof SystemInfo] as string;
        const formatted = formatValue(key, value, settings);
        if (formatted && formatted.trim()) {
          allItems.push(formatted);
        }
      }
    }

    if (allItems.length > 0) {
      console.log(allItems.join(" ") + colors.reset);
    }
    return;
  }

  // Multi-line mode with intelligent wrapping
  const lines: string[] = [];
  let currentLine = "";
  const maxLineLength = settings.display.line_wrap_length;

  for (const group of displayOrder) {
    for (const key of group) {
      const value = info[key as keyof SystemInfo] as string;
      const formatted = formatValue(key, value, settings);

      if (formatted && formatted.trim()) {
        const formattedLength = removeAnsiCodes(formatted).length;
        const currentLineLength = removeAnsiCodes(currentLine).length;

        if (
          currentLine &&
          currentLineLength + formattedLength + 1 > maxLineLength
        ) {
          lines.push(currentLine);
          currentLine = formatted;
        } else {
          currentLine = currentLine ? `${currentLine} ${formatted}` : formatted;
        }
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Output
  if (lines.length > 0) {
    lines.forEach((line) => {
      console.log(line + colors.reset);
    });
  } else if (settings.advanced.debug) {
    console.log("No system information could be displayed");
  }
}

function handleSettingsCommand(args: string[]): boolean {
  const settings = loadSettings();

  if (args.includes("--settings-init")) {
    if (saveSettings(DEFAULT_SETTINGS)) {
      console.log("Settings initialized with defaults");
    } else {
      console.log("Failed to initialize settings");
    }
    return true;
  }

  if (args.includes("--settings-show")) {
    console.log("Current settings:");
    console.log(JSON.stringify(settings, null, 2));
    return true;
  }

  if (args.includes("--settings-reset")) {
    if (saveSettings(DEFAULT_SETTINGS)) {
      console.log("Settings reset to defaults");
    } else {
      console.log("Failed to reset settings");
    }
    return true;
  }

  if (args.includes("--refresh")) {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
        console.log("Cache cleared");
      }
    } catch (error) {
      console.error("Error clearing cache:", (error as Error).message);
    }
    return true;
  }

  const setIndex = args.indexOf("--set");
  if (setIndex !== -1 && args[setIndex + 1] && args[setIndex + 2]) {
    const key = args[setIndex + 1];
    const value = args[setIndex + 2];

    try {
      const parsedValue =
        value.startsWith("{") || value.startsWith("[")
          ? JSON.parse(value)
          : value;

      const keys = key.split(".");
      let current: any = settings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = parsedValue;

      if (saveSettings(settings)) {
        console.log(`Setting ${key} = ${value}`);
      } else {
        console.log("Failed to save settings");
      }
    } catch (error) {
      console.error("Error setting value:", (error as Error).message);
    }
    return true;
  }

  return false;
}

function installShellGreeting(): void {
  const homeDir = os.homedir();

  let configDir: string, scriptPath: string;
  if (IS_WINDOWS) {
    configDir = path.join(homeDir, "AppData", "Local");
    scriptPath = path.join(configDir, "systeminfo");
  } else {
    configDir = path.join(homeDir, ".config");
    scriptPath = path.join(configDir, "systeminfo");
  }

  const currentScript = path.resolve(__filename);

  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.copyFileSync(currentScript, scriptPath);
    if (!IS_WINDOWS) {
      fs.chmodSync(scriptPath, "755");
    }

    if (IS_WINDOWS) {
      console.log("Windows installation:");
      console.log("1. Script copied to:", scriptPath);
      console.log("2. To add to PowerShell profile, run:");
      console.log(`   Add-Content $PROFILE "node '${scriptPath}'"`);
      console.log(
        "3. To add to Command Prompt, create a batch file in your startup folder"
      );

      const startupBat = path.join(configDir, "systeminfo-startup.bat");
      fs.writeFileSync(startupBat, `@echo off\nnode "${scriptPath}"\n`);
      console.log("4. Batch file created:", startupBat);
    } else {
      try {
        const hushLoginPath = path.join(homeDir, ".hushlogin");
        fs.writeFileSync(hushLoginPath, "");
      } catch {}

      const bashrcPath = path.join(homeDir, ".bashrc");
      const bashLine = `node ${scriptPath}`;

      if (fs.existsSync(bashrcPath)) {
        const bashrc = fs.readFileSync(bashrcPath, "utf8");
        if (!bashrc.includes("systeminfo")) {
          fs.appendFileSync(bashrcPath, `\n${bashLine}\n`);
        }
      } else {
        fs.writeFileSync(bashrcPath, `${bashLine}\n`);
      }

      const zshrcPath = path.join(homeDir, ".zshrc");
      if (fs.existsSync(zshrcPath)) {
        const zshrc = fs.readFileSync(zshrcPath, "utf8");
        if (!zshrc.includes("systeminfo")) {
          fs.appendFileSync(zshrcPath, `\n${bashLine}\n`);
        }
      }

      const fishConfigPath = path.join(
        homeDir,
        ".config",
        "fish",
        "config.fish"
      );
      if (fs.existsSync(fishConfigPath)) {
        const fishConfig = fs.readFileSync(fishConfigPath, "utf8");
        if (!fishConfig.includes("systeminfo")) {
          fs.appendFileSync(
            fishConfigPath,
            `\nset -U fish_greeting ""\n${bashLine}\n`
          );
        }
      }

      const nushellConfigPath = path.join(
        homeDir,
        ".config",
        "nushell",
        "config.nu"
      );
      if (fs.existsSync(nushellConfigPath)) {
        const nushellConfig = fs.readFileSync(nushellConfigPath, "utf8");
        if (!nushellConfig.includes("systeminfo")) {
          fs.appendFileSync(
            nushellConfigPath,
            `\n$env.config.show_banner = false\n${bashLine}\n`
          );
        }
      }
    }

    console.log("Shell greeting installation completed!");
  } catch (error) {
    console.error("Error installing shell greeting:", (error as Error).message);
    process.exit(1);
  }
}

function parseCLIMode(args: string[]): string[] | null {
  for (const arg of args) {
    if (!arg.startsWith("--") && arg.includes(",")) {
      return arg
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
    }
  }

  for (const arg of args) {
    if (!arg.startsWith("--") && !arg.includes("=") && arg.length > 0) {
      return [arg.trim()];
    }
  }

  return null;
}

async function showHelp(): Promise<void> {
  console.log(`
System Info Script - TypeScript Version

Usage:
  about-system [options]
  about-system <part1,part2,...>    # CLI mode: show specific parts only

Options:
  --help, -h           Show this help message
  --install            Install as shell greeting
  --settings-init      Initialize settings file with defaults
  --settings-show      Display current settings
  --settings-reset     Reset settings to defaults
  --refresh            Clear the cache file
  --set <key> <value>  Set a configuration value (use dot notation)
  --json               Output as JSON

Examples:
  about-system                      # Show all info (default)
  about-system cpu,os               # Show only CPU and OS info
  about-system user,hostname,ip     # Show user, hostname, and IP
  about-system disk_used            # Show only disk usage
  about-system --install
  about-system --set display.show_emojis false
  about-system --set colors.user blue
  about-system --set emojis.cpu "🚀 "
  about-system --set labels.cpu "Processor"
  about-system --json

Settings file: ${SETTINGS_FILE}
Cache file: ${CACHE_FILE}

Platform: ${
    IS_WINDOWS
      ? "Windows"
      : os.platform() === "darwin"
      ? "macOS"
      : os.platform() === "linux"
      ? "Linux"
      : "Unknown"
  }

Available display blocks:
  Basic: user, hostname, uptime, shell, os, kernel, device
  Resources: disk_used, ram_used, memory_available, swap_used, top_process
  Network: ip, iplocal, city, domain, isp, network_interfaces
  Hardware: cpu, gpu, temperature, battery, screen_resolution
  System: load_average, users_logged_in, mount_points, services_running
  Tools: pacman, ports, containers
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (handleSettingsCommand(args)) {
    return;
  }

  if (args.includes("--help") || args.includes("-h")) {
    await showHelp();
    return;
  }

  if (args.includes("--install")) {
    installShellGreeting();
    return;
  }

  if (args.includes("--json")) {
    const info = await getSystemInfo();
    console.log(JSON.stringify(info, null, 2));
    return;
  }

  const cliParts = parseCLIMode(args);
  if (cliParts) {
    const customDisplayOrder = [cliParts];
    await displaySystemInfo(customDisplayOrder);
    return;
  }

  await displaySystemInfo();
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});

export { displaySystemInfo, installShellGreeting };
