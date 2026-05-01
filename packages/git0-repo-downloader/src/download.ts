import chalk from 'chalk';
import gitUrlParse from 'git-url-parse';
import fs from 'fs';
import * as tar from 'tar';
import path from 'path';
import { getCurrentPlatform } from './platform.js';

/**
 * Returns `basePath` unchanged when the path does not yet exist on disk.
 * When it does exist, appends `-2`, `-3`, … until an unused path is found.
 *
 * Used so that downloading the same repo twice never silently overwrites the
 * first copy.
 *
 * @param basePath - Desired extraction directory path.
 * @returns An available directory path guaranteed not to exist yet.
 *
 * @example
 * // ./react already exists, ./react-2 does not
 * getAvailableDirectoryName('./react'); // → './react-2'
 */
export function getAvailableDirectoryName(basePath: string): string {
  if (!fs.existsSync(basePath)) return basePath;
  let counter = 2;
  while (true) {
    const candidate = `${basePath}-${counter}`;
    if (!fs.existsSync(candidate)) return candidate;
    counter++;
  }
}

/**
 * Streams a GitHub tarball response directly into a `tar` extractor.
 *
 * `strip: 1` removes the top-level directory that GitHub adds to every
 * tarball (e.g. `owner-repo-abc1234/`) so files land directly in
 * `extractPath`.
 *
 * @param res - The `ReadableStream` body from the GitHub API response.
 * @param extractPath - Absolute directory to extract into (must already exist).
 * @returns Promise that resolves when extraction is complete.
 *
 * @internal
 */
async function streamTarball(res: ReadableStream, extractPath: string): Promise<void> {
  const { Readable } = await import('stream');
  const nodeStream = Readable.fromWeb(res);
  await new Promise<void>((resolve, reject) => {
    nodeStream
      .pipe(tar.x({ C: extractPath, strip: 1 }))
      .on('finish', resolve)
      .on('error', reject);
  });
}

/**
 * Streams a GitHub API response body directly to a file on disk.
 *
 * @param res - The `ReadableStream` body from the GitHub API response.
 * @param dest - Absolute path of the file to create/overwrite.
 * @returns Promise that resolves when the file is fully written.
 *
 * @internal
 */
async function streamToFile(res: ReadableStream, dest: string): Promise<void> {
  const { Readable } = await import('stream');
  const nodeStream = Readable.fromWeb(res);
  await new Promise<void>((resolve, reject) => {
    nodeStream
      .pipe(fs.createWriteStream(dest))
      .on('finish', resolve)
      .on('error', reject);
  });
}

/**
 * Downloads a GitHub repository tarball and extracts it into a local directory.
 *
 * The function first attempts to download the `master` branch; if that request
 * returns an error it retries with `main`. The extracted directory name is
 * derived from the repository name, with a numeric suffix appended when the
 * target already exists (see {@link getAvailableDirectoryName}).
 *
 * @param callGithub - Pre-configured `grab` instance bound to the GitHub API.
 * @param repo - GitHub URL (`https://github.com/owner/repo`) or `owner/repo`.
 * @param targetDir - Optional custom folder name; defaults to the repo name.
 * @returns Absolute path of the directory the repo was extracted into.
 *
 * @example
 * const dir = await downloadRepo(callGithub, 'https://github.com/facebook/react');
 * // → '/current/working/dir/react'
 */
export async function downloadRepo(
  callGithub: Function,
  repo: string,
  targetDir: string | null = null
): Promise<string> {
  const parsed = gitUrlParse(repo);

  // GitHub tarballs for forks include the fork chain in `owner`, e.g. "upstream/fork".
  // We only want the last segment.
  if (parsed.owner.includes('/')) {
    parsed.owner = parsed.owner.split('/').slice(-1)[0];
  }

  const defaultDir = path.resolve(process.cwd(), targetDir?.length ? targetDir : parsed.name);
  const extractPath = getAvailableDirectoryName(defaultDir);

  fs.mkdirSync(extractPath, { recursive: true });

  console.log(chalk.blue(`📦 Downloading ${parsed.name} into ${path.basename(extractPath)}...`));

  const defaultBranch = (parsed as any).default_branch || 'master';
  const tarballUrl = `/repos/${parsed.owner}/${parsed.name}/tarball/${defaultBranch}`;
  const params = { onStream: (res: ReadableStream) => streamTarball(res, extractPath) };

  let response = await callGithub(tarballUrl, params);
  if (response.error) {
    response = await callGithub(tarballUrl.replace('/master', '/main'), params);
  }

  return extractPath;
}

/**
 * Downloads a single release asset binary from GitHub to a local file.
 *
 * After a successful download:
 * - On non-Windows, extension-less files are made executable (`chmod 755`).
 * - Platform-specific install instructions are printed via
 *   {@link printInstallInstructions}.
 *
 * @param callGithub - Pre-configured `grab` instance bound to the GitHub API.
 * @param packageURL - Direct HTTPS download URL for the asset.
 * @param downloadPath - Absolute local file path to write the asset to.
 * @returns The `downloadPath` on success.
 * @throws When the download request fails.
 *
 * @example
 * await downloadPackage(callGithub,
 *   'https://github.com/user/repo/releases/download/v1.0/app-linux-x64',
 *   '/tmp/app-linux-x64'
 * );
 */
export async function downloadPackage(
  callGithub: Function,
  packageURL: string,
  downloadPath: string
): Promise<string> {
  const fileName = path.basename(downloadPath);

  console.log(chalk.blue(`📦 Downloading ${fileName}...`));

  try {
    await callGithub(packageURL, {
      onStream: (res: ReadableStream) => streamToFile(res, downloadPath),
    });

    console.log(chalk.green(`✅ Downloaded ${fileName} to ${downloadPath}`));

    if (process.platform !== 'win32' && !fileName.includes('.')) {
      try {
        fs.chmodSync(downloadPath, '755');
        console.log(chalk.green(`✅ Made ${fileName} executable`));
      } catch {
        console.log(chalk.yellow(`⚠️  Could not make ${fileName} executable`));
      }
    }

    printInstallInstructions(downloadPath, fileName);
    return downloadPath;
  } catch (error: any) {
    console.error(chalk.red(`❌ Failed to download ${fileName}:`), error.message);
    throw error;
  }
}

/**
 * Prints platform-specific shell commands for installing or running a
 * downloaded asset.
 *
 * The output adapts to the current OS and the file's extension:
 * - **Windows**: `.exe` run command, `.msi` installer command.
 * - **macOS**: `.dmg` open command, `.pkg` installer command.
 * - **Linux**: `.deb` dpkg, `.rpm` rpm, `.AppImage` run command,
 *   extension-less binaries get a `mv` to `/usr/local/bin` suggestion.
 *
 * @param filePath - Absolute path of the downloaded file.
 * @param fileName - Basename of the downloaded file (used for extension checks).
 *
 * @example
 * printInstallInstructions('/tmp/myapp', 'myapp');
 * // Prints:
 * //   Binary is ready to use:
 * //   "/tmp/myapp"
 * //   Consider moving to PATH:
 * //   sudo mv "/tmp/myapp" /usr/local/bin/
 */
export function printInstallInstructions(filePath: string, fileName: string): void {
  const platform = getCurrentPlatform();

  if (platform.platform === 'win32') {
    if (fileName.endsWith('.exe')) {
      console.log(chalk.white('  Run the executable:'));
      console.log(chalk.gray(`  ${filePath}`));
    } else if (fileName.endsWith('.msi')) {
      console.log(chalk.white('  Install the MSI package:'));
      console.log(chalk.gray(`  msiexec /i "${filePath}"`));
    }
    return;
  }

  if (platform.platform === 'darwin') {
    if (fileName.endsWith('.dmg')) {
      console.log(chalk.white('  Mount and install the DMG:'));
      console.log(chalk.gray(`  open "${filePath}"`));
    } else if (fileName.endsWith('.pkg')) {
      console.log(chalk.white('  Install the package:'));
      console.log(chalk.gray(`  sudo installer -pkg "${filePath}" -target /`));
    }
    return;
  }

  // Linux / other Unix
  if (fileName.endsWith('.deb')) {
    console.log(chalk.white('  Install the DEB package:'));
    console.log(chalk.gray(`  sudo dpkg -i "${filePath}"`));
  } else if (fileName.endsWith('.rpm')) {
    console.log(chalk.white('  Install the RPM package:'));
    console.log(chalk.gray(`  sudo rpm -i "${filePath}"`));
  } else if (fileName.endsWith('.AppImage')) {
    console.log(chalk.white('  Run the AppImage:'));
    console.log(chalk.gray(`  chmod +x "${filePath}" && "${filePath}"`));
  } else if (!fileName.includes('.')) {
    console.log(chalk.white('  Binary is ready to use:'));
    console.log(chalk.gray(`  "${filePath}"`));
    console.log(chalk.white('  Consider moving to PATH:'));
    console.log(chalk.gray(`  sudo mv "${filePath}" /usr/local/bin/`));
  }
}
