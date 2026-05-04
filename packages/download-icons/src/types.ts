export type Platform =
  | "ios"
  | "android"
  | "chrome-extension"
  | "chrome-extension-white"
  | "macos"
  | "windows"
  | "linux"
  | "linux-snap";

interface DownloadButtonBase {
  /** Target platform — determines which badge image is shown */
  platform: Platform;
  /** Whether to open in a new tab (default: true) */
  newTab?: boolean;
  /** Height of the badge image in pixels (default: 56) */
  height?: number;
  /** Additional class names applied to the anchor element */
  className?: string;
  /** Accessible label override — defaults to the platform display name */
  alt?: string;
  /**
   * Automatically apply a golden glow highlight when the platform matches
   * the user's current OS (detected via navigator.userAgent). Default: false.
   */
  autoHighlight?: boolean;
  /**
   * Manually force the golden glow highlight on or off, overriding autoHighlight.
   */
  highlight?: boolean;
}

/** Provide an explicit URL. */
type WithHref = DownloadButtonBase & { href: string; appId?: never };

/**
 * Provide a platform app identifier and the correct store URL is built
 * automatically. See buildStoreUrl() for the expected format per platform.
 */
type WithAppId = DownloadButtonBase & { appId: string; href?: never };

export type DownloadButtonProps = WithHref | WithAppId;
