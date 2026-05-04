import type { Platform } from "./types";
import type { OS } from "./os";
import { platformMatchesOS } from "./os";

const isNumeric = (id: string) => /^\d+$/.test(id);

/**
 * Web (browser-safe) store URLs — always work regardless of OS.
 *
 * appId formats:
 *  ios / macos        — numeric App Store ID ("6474268307") or bundle ID ("com.example.app")
 *  android            — package name ("com.example.app")
 *  chrome-extension*  — Chrome extension ID ("noecbaibfhbmpapofcdkgchfifmoinfj")
 *  windows            — Microsoft Partner Center product ID ("9NBLGGH4NNS1")
 *  linux-snap         — snap name ("my-app")
 *  linux              — no universal URL, returns null
 */
export function buildStoreUrl(platform: Platform, appId: string): string | null {
  switch (platform) {
    case "ios":
    case "macos":
      return isNumeric(appId)
        ? `https://apps.apple.com/app/id${appId}`
        : `https://apps.apple.com/app/${appId}`;

    case "android":
      return `https://play.google.com/store/apps/details?id=${appId}`;

    case "chrome-extension":
    case "chrome-extension-white":
      return `https://chromewebstore.google.com/detail/${appId}`;

    case "windows":
      return `https://apps.microsoft.com/detail/${appId}?rtc=1`;

    case "linux-snap":
      return `https://snapcraft.io/${appId}`;

    case "linux":
      return null;
  }
}

/**
 * Native deep-link URLs — open the platform's native store app directly.
 * Returns null when no deep link exists for the platform.
 *
 * Schemes by platform:
 *  ios     → itms-apps://        (iOS App Store)
 *  macos   → macappstore://      (Mac App Store; numeric IDs only)
 *  android → market://           (Google Play Store)
 *  windows → ms-windows-store:// (Microsoft Store)
 */
export function buildDeepLink(platform: Platform, appId: string): string | null {
  switch (platform) {
    case "ios":
      return isNumeric(appId)
        ? `itms-apps://itunes.apple.com/app/id${appId}`
        : `itms-apps://itunes.apple.com/app/${appId}`;

    case "macos":
      // macappstore:// reliably supports numeric IDs only
      return isNumeric(appId)
        ? `macappstore://itunes.apple.com/app/id${appId}`
        : null;

    case "android":
      return `market://details?id=${appId}`;

    case "windows":
      return `ms-windows-store://pdp/?productid=${appId}`;

    case "chrome-extension":
    case "chrome-extension-white":
    case "linux-snap":
    case "linux":
      return null;
  }
}

/**
 * Returns the best href for a given platform + appId:
 * - When the user is on the matching OS, uses the native deep link so the
 *   store app opens directly without a browser redirect.
 * - Falls back to the web store URL for all other cases.
 */
export function resolveHref(platform: Platform, appId: string, os: OS): string {
  if (platformMatchesOS(platform, os)) {
    const deep = buildDeepLink(platform, appId);
    if (deep) return deep;
  }
  return buildStoreUrl(platform, appId) ?? "#";
}
