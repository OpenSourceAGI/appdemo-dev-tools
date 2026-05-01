import os from 'os';
import type { PlatformInfo } from './types.js';

/**
 * Maps Node.js `os.platform()` strings to canonical OS names used throughout
 * the release-categorisation logic.
 *
 * @internal
 */
const PLATFORM_MAP: Record<string, string> = {
  win32: 'windows',
  darwin: 'macos',
  linux: 'linux',
};

/**
 * Maps Node.js `os.arch()` strings to the canonical architecture names that
 * are matched against release-asset filenames.
 *
 * @internal
 */
const ARCH_MAP: Record<string, string> = {
  x64: 'x86_64',
  arm64: 'arm64',
  arm: 'arm',
  ia32: 'i386',
};

/**
 * Returns normalized OS and CPU architecture information for the current machine.
 *
 * Node.js uses platform-specific strings (`darwin`, `win32`, `x64`) that differ
 * from the naming conventions used in GitHub release asset filenames. This function
 * maps them to the canonical names used by the rest of the codebase.
 *
 * @returns A {@link PlatformInfo} object with both canonical and raw values.
 *
 * @example
 * const p = getCurrentPlatform();
 * // Apple Silicon Mac → { os: 'macos', arch: 'arm64', platform: 'darwin', architecture: 'arm64' }
 * // x86-64 Linux     → { os: 'linux', arch: 'x86_64', platform: 'linux',  architecture: 'x64'  }
 */
export function getCurrentPlatform(): PlatformInfo {
  const platform = os.platform();
  const arch = os.arch();

  return {
    os: PLATFORM_MAP[platform] || platform,
    arch: ARCH_MAP[arch] || arch,
    platform,
    architecture: arch,
  };
}
