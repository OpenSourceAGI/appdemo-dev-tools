import type { Platform } from "./types";

export enum OS {
  iOS = "ios",
  Android = "android",
  macOS = "macos",
  Windows = "windows",
  Linux = "linux",
  Unknown = "unknown",
}

export function getOS(): OS {
  if (typeof navigator === "undefined") return OS.Unknown;
  const ua = navigator.userAgent;

  // iOS — must check before macOS since iPads report "Mac" on modern iPadOS
  if (/iPad|iPhone|iPod/.test(ua)) return OS.iOS;

  if (/android/i.test(ua)) return OS.Android;

  // macOS
  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) return OS.macOS;

  if (/Win/.test(ua)) return OS.Windows;

  if (/Linux/.test(ua)) return OS.Linux;

  return OS.Unknown;
}

/** Returns true when a given platform badge is a natural match for the detected OS. */
export function platformMatchesOS(platform: Platform, os: OS): boolean {
  switch (os) {
    case OS.iOS:
      return platform === "ios";
    case OS.Android:
      return platform === "android";
    case OS.macOS:
      return (
        platform === "macos" ||
        platform === "chrome-extension" ||
        platform === "chrome-extension-white"
      );
    case OS.Windows:
      return (
        platform === "windows" ||
        platform === "chrome-extension" ||
        platform === "chrome-extension-white"
      );
    case OS.Linux:
      return (
        platform === "linux" ||
        platform === "linux-snap" ||
        platform === "chrome-extension" ||
        platform === "chrome-extension-white"
      );
    case OS.Unknown:
      return false;
  }
}
