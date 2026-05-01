import type { PlatformInfo, ReleaseAsset, PlatformAssets, CategorizedRelease } from './types.js';

/**
 * Filename substrings used to identify which operating system a release asset
 * targets. Matching is case-insensitive and applied to the full asset filename.
 *
 * @internal
 */
const PLATFORM_KEYWORDS: Record<keyof Omit<PlatformAssets, 'universal'>, string[]> = {
  windows: ['win', 'windows', 'win32', 'win64', '.exe', '.msi'],
  macos: ['mac', 'macos', 'darwin', 'osx', '.dmg', '.pkg'],
  linux: ['linux', 'ubuntu', 'debian', '.deb', '.rpm', '.tar.gz', '.AppImage'],
};

/**
 * Filename substrings used to identify the CPU architecture of a release asset.
 * Matching is case-insensitive and runs after platform detection.
 *
 * @internal
 */
const ARCH_KEYWORDS: Record<string, string[]> = {
  arm64: ['aarch64', 'arm64'],   // must come before x86_64 — 'aarch64' contains '64'
  arm:   ['armv7', 'armv6'],     // must come before bare 'arm' to avoid partial matches
  x86_64: ['x86_64', 'amd64', 'x64'],
  i386:  ['i386', 'x86_32'],
};

/**
 * Detects the CPU architecture of a release asset from its filename.
 *
 * Iterates over {@link ARCH_KEYWORDS} in insertion order and returns the first
 * match. Returns `'unknown'` when no keyword matches.
 *
 * @param name - Lowercased asset filename.
 * @returns Canonical arch string, e.g. `'arm64'`, or `'unknown'`.
 *
 * @example
 * detectArch('myapp-v1.0-linux-aarch64.tar.gz'); // → 'arm64'
 * detectArch('myapp-v1.0-linux.tar.gz');          // → 'unknown'
 */
function detectArch(name: string): string {
  for (const [arch, keys] of Object.entries(ARCH_KEYWORDS)) {
    if (keys.some(k => name.includes(k.toLowerCase()))) return arch;
  }
  return 'unknown';
}

/**
 * Determines whether an asset filename matches any known platform keyword.
 *
 * @param name - Lowercased asset filename.
 * @returns `true` if at least one platform keyword is found.
 *
 * @internal
 */
function hasKnownPlatformKeyword(name: string): boolean {
  return Object.values(PLATFORM_KEYWORDS)
    .flat()
    .some(kw => name.includes(kw.toLowerCase()));
}

/**
 * Classifies a single release asset into a platform bucket and annotates it
 * with the detected architecture.
 *
 * Assets that match no known platform keyword are placed into `universal` if
 * their filename contains `'universal'` or `'all'`, or if it contains none of
 * the three major platform words (`win`, `mac`, `linux`).
 *
 * @param asset - Raw GitHub release asset object.
 * @param platformAssets - Mutable bucket object to push the asset into.
 *
 * @internal
 */
function classifyAsset(asset: ReleaseAsset, platformAssets: PlatformAssets): void {
  const name = asset.name.toLowerCase();

  // Explicit universal label wins regardless of any other keyword matches
  // (e.g. 'app-universal.tar.gz' should not be mis-filed under linux).
  if (name.includes('universal')) {
    platformAssets.universal.push({ ...asset, detectedArch: 'universal', platform: 'universal' });
    return;
  }

  let categorized = false;

  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    if (keywords.some(kw => name.includes(kw.toLowerCase()))) {
      (platformAssets as unknown as Record<string, ReleaseAsset[]>)[platform].push({
        ...asset,
        detectedArch: detectArch(name),
        platform,
      });
      categorized = true;
    }
  }

  if (!categorized) {
    platformAssets.universal.push({ ...asset, detectedArch: 'universal', platform: 'universal' });
  }
}

/**
 * Groups every asset in each release into per-platform buckets.
 *
 * Releases that have no assets in any bucket are dropped from the result so
 * the caller never sees empty entries.
 *
 * @param releases - Raw release array from the GitHub API.
 * @returns Releases annotated with a `platformAssets` map. Only releases that
 *   have at least one asset in at least one platform bucket are included.
 *
 * @example
 * const categorized = categorizeReleasesByPlatform(rawReleases);
 * categorized[0].platformAssets.linux; // → ReleaseAsset[]
 */
export function categorizeReleasesByPlatform(releases: any[]): CategorizedRelease[] {
  const result: CategorizedRelease[] = [];

  for (const release of Object.values(releases)) {
    const platformAssets: PlatformAssets = { windows: [], macos: [], linux: [], universal: [] };

    for (const asset of release?.assets ?? []) {
      classifyAsset(asset, platformAssets);
    }

    if (Object.values(platformAssets).some(a => a.length > 0)) {
      result.push({ ...release, platformAssets });
    }
  }

  return result;
}

/**
 * Filters a raw release list down to releases that have at least one asset
 * compatible with the given platform.
 *
 * "Compatible" means the release has assets in the platform's own bucket
 * **or** in the `universal` bucket.
 *
 * @param releases - Raw release array from the GitHub API.
 * @param currentPlatform - Platform info from {@link getCurrentPlatform}.
 * @returns Subset of categorized releases that can run on `currentPlatform`.
 *
 * @example
 * const compatible = filterReleasesByPlatform(raw, getCurrentPlatform());
 * // Only releases with linux or universal assets on a Linux machine
 */
export function filterReleasesByPlatform(
  releases: any[],
  currentPlatform: PlatformInfo
): CategorizedRelease[] {
  return categorizeReleasesByPlatform(releases).filter(
    r =>
      (r.platformAssets as unknown as Record<string, ReleaseAsset[]>)[currentPlatform.os]?.length > 0 ||
      r.platformAssets.universal?.length > 0
  );
}
