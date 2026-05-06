import androidBadge from "../images/download-android.svg";
import extensionBadge from "../images/download-extension.png";
import extensionWhiteBadge from "../images/download-extension-white.png";
import iosBadge from "../images/download-ios.svg";
import linuxBadge from "../images/download-linux.png";
import linuxSnapBadge from "../images/download-linux-snap.png";
import macosBadge from "../images/download-macos.png";
import windowsBadge from "../images/download-windows.svg";
import type { Platform } from "./types";

export const BADGE_IMAGES: Record<Platform, string> = {
  android: androidBadge,
  "chrome-extension": extensionBadge,
  "chrome-extension-white": extensionWhiteBadge,
  ios: iosBadge,
  linux: linuxBadge,
  "linux-snap": linuxSnapBadge,
  macos: macosBadge,
  windows: windowsBadge,
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  android: "Get it on Google Play",
  "chrome-extension": "Available in the Chrome Web Store",
  "chrome-extension-white": "Available in the Chrome Web Store",
  ios: "Download on the App Store",
  linux: "Download for Linux",
  "linux-snap": "Get it from the Snap Store",
  macos: "Download on the Mac App Store",
  windows: "Get it from Microsoft",
};
