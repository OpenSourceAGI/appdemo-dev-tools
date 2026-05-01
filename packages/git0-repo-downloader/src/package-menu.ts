import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import type { CategorizedRelease, ReleaseAsset, PlatformInfo } from './types.js';

/** Emoji and display label for each supported platform key. @internal */
const PLATFORM_META: Record<string, { emoji: string; label: string }> = {
  windows: { emoji: '🪟', label: 'Windows'   },
  macos:   { emoji: '🍎', label: 'macOS'     },
  linux:   { emoji: '🐧', label: 'Linux'     },
  universal:{ emoji: '🌐', label: 'Universal' },
};

/** Fixed display order for platform sections in the menu. @internal */
const PLATFORM_ORDER = ['windows', 'macos', 'linux', 'universal'] as const;

/**
 * Builds the colored header line shown above each platform's asset group.
 *
 * The header is highlighted in green when it matches the user's current OS or
 * is the `universal` bucket, and dimmed gray otherwise.
 *
 * @param platform         - Platform key, e.g. `'linux'`.
 * @param tagName          - Release tag, e.g. `'v1.2.3'`.
 * @param isCurrentPlatform - Whether this platform matches the running OS.
 * @returns A formatted `inquirer` separator-style choice object.
 *
 * @internal
 */
function buildPlatformHeader(
  platform: string,
  tagName: string,
  isCurrentPlatform: boolean
): { name: string; disabled: true } {
  const { emoji, label } = PLATFORM_META[platform];
  const platformLabel = isCurrentPlatform
    ? chalk.green(`${emoji} ${label} (Your Platform)`)
    : chalk.gray(`${emoji} ${label}`);

  return {
    name: `${chalk.bold(tagName)} - ${platformLabel}`,
    disabled: true,
  };
}

/**
 * Builds a selectable `inquirer` choice for a single release asset.
 *
 * Shows the asset filename, detected CPU architecture (when known), and size
 * in MB. The row is white when it belongs to the current platform and gray
 * when it belongs to a different one.
 *
 * @param asset             - The release asset to represent.
 * @param isCurrentPlatform - Whether the asset's platform matches the running OS.
 * @param release           - Parent release (included in the choice value).
 * @returns An `inquirer` choice object with a `value` of `{ release, asset }`.
 *
 * @internal
 */
function buildAssetChoice(
  asset: ReleaseAsset,
  isCurrentPlatform: boolean,
  release: CategorizedRelease
): { name: string; value: { release: CategorizedRelease; asset: ReleaseAsset } } {
  const sizeMB  = (asset.size / 1024 / 1024).toFixed(2);
  const archTag = asset.detectedArch !== 'unknown' && asset.detectedArch !== 'universal'
    ? chalk.cyan(`[${asset.detectedArch}]`)
    : '';
  const color   = isCurrentPlatform ? chalk.white : chalk.gray;

  return {
    name: `  ${color(`${asset.name} ${archTag} (${sizeMB} MB)`)}`,
    value: { release, asset },
  };
}

/**
 * Appends a visual separator to `choices` unless the last entry is already a
 * separator. Prevents double-separators between adjacent platform groups.
 *
 * @param choices - Mutable choice list to append into.
 *
 * @internal
 */
function maybeAddSeparator(choices: any[]): void {
  const last = choices[choices.length - 1];
  if (choices.length > 0 && !last?.name?.includes('────')) {
    choices.push({ name: chalk.gray('────────────────────────────────'), disabled: true });
  }
}

/**
 * Builds the complete flat choice list for `inquirer` from a list of releases.
 *
 * Iterates platforms in {@link PLATFORM_ORDER}, then assets within each
 * platform, inserting section headers and separators as it goes. Only the
 * first `limit` releases are shown to keep the list manageable.
 *
 * @param releases        - Categorized release objects to render.
 * @param currentPlatform - The user's platform, used to highlight matching rows.
 * @param limit           - Maximum number of releases to display (default 2).
 * @returns Flat array of `inquirer` choice objects (headers, separators, assets).
 *
 * @example
 * const choices = buildReleaseChoices(repo.allReleases, getCurrentPlatform());
 * // → [{ name: 'v1.0 - 🐧 Linux (Your Platform)', disabled: true }, { name: '  app-linux-x64 (12.34 MB)', value: … }, …]
 */
export function buildReleaseChoices(
  releases: CategorizedRelease[],
  currentPlatform: PlatformInfo,
  limit = 2
): any[] {
  const choices: any[] = [];

  for (const release of releases.slice(0, limit)) {
    for (const platform of PLATFORM_ORDER) {
      const assets = release.platformAssets[platform];
      if (!assets?.length) continue;

      const isCurrentPlatform = platform === currentPlatform.os || platform === 'universal';

      maybeAddSeparator(choices);
      choices.push(buildPlatformHeader(platform, release.tag_name, isCurrentPlatform));

      for (const asset of assets) {
        choices.push(buildAssetChoice(asset, isCurrentPlatform, release));
      }
    }
  }

  return choices;
}

/**
 * Presents an interactive terminal menu of release packages grouped by
 * platform and prompts the user to pick one to download.
 *
 * The menu shows up to 2 releases (configurable via {@link buildReleaseChoices})
 * with each release's assets grouped under platform headings. The heading for
 * the user's current OS is highlighted in green. After selection, the asset is
 * downloaded to the current working directory.
 *
 * Returns early with a warning when no downloadable assets exist.
 *
 * @param selectedRepo   - Repo object that must include `allReleases`.
 * @param downloadPackage - Async function that performs the actual file download.
 * @param currentPlatform - Platform info used to highlight the matching section.
 *
 * @example
 * await showPackageMenu(
 *   selectedRepo,
 *   github.downloadPackage.bind(github),
 *   github.getCurrentPlatform()
 * );
 */
export async function showPackageMenu(
  selectedRepo: { allReleases: CategorizedRelease[] },
  downloadPackage: (url: string, dest: string) => Promise<string>,
  currentPlatform: PlatformInfo
): Promise<void> {
  const choices = buildReleaseChoices(selectedRepo.allReleases, currentPlatform);
  const selectableChoices = choices.filter(c => !c.disabled);

  if (selectableChoices.length === 0) {
    console.log(chalk.yellow('No packages found for download.'));
    return;
  }

  const { selectedPackage } = await inquirer.prompt({
    type: 'list',
    name: 'selectedPackage',
    message: 'Select a package to download:',
    choices,
    pageSize: 15,
  });

  const downloadDir = path.resolve(process.cwd());
  fs.mkdirSync(downloadDir, { recursive: true });

  const downloadPath = path.join(downloadDir, selectedPackage.asset.name);
  await downloadPackage(selectedPackage.asset.browser_download_url, downloadPath);
}
