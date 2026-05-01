/**
 * Normalized operating system and CPU architecture for the current machine.
 * All string values are lowercased and mapped to a canonical form.
 * @example
 * // On an Apple Silicon Mac:
 * // { os: 'macos', arch: 'arm64', platform: 'darwin', architecture: 'arm64' }
 */
export interface PlatformInfo {
  /** Canonical OS name: `'windows'`, `'macos'`, or `'linux'`. */
  os: string;
  /** Canonical arch name: `'x86_64'`, `'arm64'`, `'arm'`, or `'i386'`. */
  arch: string;
  /** Raw `os.platform()` value, e.g. `'darwin'`, `'win32'`, `'linux'`. */
  platform: string;
  /** Raw `os.arch()` value, e.g. `'x64'`, `'arm64'`. */
  architecture: string;
}

/**
 * A single downloadable file attached to a GitHub release,
 * extended with platform/arch fields detected from the filename.
 */
export interface ReleaseAsset {
  /** Original filename as uploaded to the GitHub release. */
  name: string;
  /** File size in bytes. */
  size: number;
  /** Direct HTTPS URL to download this asset. */
  browser_download_url: string;
  /** Detected CPU architecture from the filename, or `'unknown'` / `'universal'`. */
  detectedArch: string;
  /** Detected OS platform from the filename, e.g. `'linux'` or `'universal'`. */
  platform: string;
  [key: string]: unknown;
}

/**
 * Release assets bucketed by target operating system.
 * Assets that match no known platform keyword land in `universal`.
 */
export interface PlatformAssets {
  windows: ReleaseAsset[];
  macos: ReleaseAsset[];
  linux: ReleaseAsset[];
  /** Assets with no platform keyword, or explicitly labelled `universal` / `all`. */
  universal: ReleaseAsset[];
}

/**
 * A GitHub release object enriched with per-platform asset buckets.
 */
export interface CategorizedRelease {
  /** Git tag name, e.g. `'v1.2.3'`. */
  tag_name: string;
  /** Assets grouped by target platform. */
  platformAssets: PlatformAssets;
  /** Raw asset list from the GitHub API. */
  assets: ReleaseAsset[];
  [key: string]: unknown;
}

/**
 * A GitHub repository search result enriched with release availability flags.
 */
export interface SearchResult {
  /** `owner/name` slug, e.g. `'facebook/react'`. */
  full_name: string;
  /** Repository name without owner prefix. */
  name: string;
  /** Short description from the repo's About field. */
  description: string;
  /** Total number of GitHub stars. */
  stargazers_count: number;
  /** Primary programming language detected by GitHub. */
  language: string;
  /** HTTPS URL of the repository. */
  url: string;
  /** Repository owner info. */
  owner: { login: string };
  /** True if the repo has at least one release with any assets. */
  hasReleases: boolean;
  /** True if the repo has at least one release compatible with the current platform. */
  hasCompatibleReleases: boolean;
  /** Releases filtered to the current platform. */
  releases: CategorizedRelease[];
  /** All releases with every platform's assets categorized. */
  allReleases: CategorizedRelease[];
  [key: string]: unknown;
}

/** Candidate IDE entry used when probing for an installed editor. */
export interface IdeInfo {
  /** Human-readable name shown in log output, e.g. `'VSCode'`. */
  name: string;
  /** Shell command used to invoke the editor, e.g. `'code'`. */
  cmd: string;
}
