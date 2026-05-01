#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import GithubAPI from './github-api.js';
import { openInIDE } from './ide.js';
import { installDependencies } from './install.js';
import { showPackageMenu } from './package-menu.js';
import { printLogo } from './utils.js';
import type { SearchResult } from './types.js';

const Github = new GithubAPI({ debug: false });

/**
 * Downloads a GitHub repository tarball, then immediately opens the project in
 * an IDE and installs its dependencies.
 *
 * The IDE launch is deferred 500 ms so the extraction can finish writing files
 * before the editor tries to index them.
 *
 * @param repo       - GitHub URL (`https://…`) or `owner/repo` shorthand.
 * @param folderPath - Optional name for the extraction directory; defaults to
 *   the repository name.
 *
 * @example
 * await downloadRepoAndSetup('https://github.com/vitejs/vite');
 * // Downloads vite/, opens it in the first available IDE, runs bun install
 */
async function downloadRepoAndSetup(repo: string, folderPath: string | null = null): Promise<void> {
  printLogo();
  const extractPath = await Github.downloadRepo(repo, folderPath);
  setTimeout(() => openInIDE(extractPath), 500);
  await installDependencies(extractPath);
}

/**
 * Builds the display label shown in the repository selection list.
 *
 * Shows the full `owner/name` slug, description, star count, language, and a
 * colored badge when release packages are available for the current platform.
 *
 * @param repo - Enriched search result from `searchRepositories`.
 * @returns Multi-line string suitable for an `inquirer` list choice label.
 *
 * @internal
 */
function formatRepoChoice(repo: SearchResult): string {
  const packageInfo = repo.hasCompatibleReleases
    ? chalk.green(' 📦 Packages available')
    : repo.hasReleases
      ? chalk.yellow(' 📦 Packages (other platforms)')
      : '';

  return (
    `${chalk.bold(repo.full_name)} - ${chalk.gray(repo.description || 'No description')}\n` +
    `      ${chalk.yellow(`★ ${repo.stargazers_count}`)} | ${chalk.blue(repo.language || 'Unknown')}${packageInfo}`
  );
}

/**
 * Prompts the user to choose between downloading the binary package, the
 * source code, or both when a repository has release assets.
 *
 * @param selectedRepo - The repository the user chose in the search results.
 *
 * @internal
 */
async function handleRepoDownload(selectedRepo: SearchResult): Promise<void> {
  if (!selectedRepo.hasReleases && !selectedRepo.hasCompatibleReleases) {
    await downloadRepoAndSetup(selectedRepo.url);
    return;
  }

  const { downloadChoice } = await inquirer.prompt({
    type: 'list',
    name: 'downloadChoice',
    message: 'This repository has downloadable packages. What would you like to do?',
    choices: [
      { name: '📦 Download package/binary', value: 'package' },
      { name: '📂 Download source code',    value: 'source'  },
      { name: '📦📂 Download both',          value: 'both'    },
    ],
  });

  if (downloadChoice === 'package' || downloadChoice === 'both') {
    await showPackageMenu(
      selectedRepo,
      Github.downloadPackage.bind(Github),
      Github.getCurrentPlatform()
    );
  }
  if (downloadChoice === 'source' || downloadChoice === 'both') {
    await downloadRepoAndSetup(selectedRepo.url);
  }
}

/**
 * CLI entry point for the `git0` / `g` / `gg` commands.
 *
 * **Flow:**
 * 1. Parse `process.argv` for a search query or direct repo URL.
 * 2. If the argument looks like a GitHub URL or `owner/repo`, download it
 *    directly — optionally into a custom folder (second CLI argument).
 * 3. Otherwise, search GitHub and present an interactive list.
 * 4. After the user picks a repo, offer package vs. source download when
 *    releases are available.
 *
 * Exits with code `1` on missing arguments or an empty search result.
 *
 * @example
 * // Direct download:
 * //   git0 facebook/react
 * //   git0 https://github.com/vitejs/vite my-vite-copy
 *
 * // Search:
 * //   git0 react template starter
 */
async function main(): Promise<void> {
  printLogo();

  const args = process.argv.slice(2);
  if (!args.length) {
    console.log(chalk.yellow('Usage: git0 <github-url | owner/repo | search-query>'));
    process.exit(1);
  }

  const query = args.join(' ');
  const parsed = Github.parseURL(query);

  if (parsed && parsed.owner && parsed.name) {
    await downloadRepoAndSetup(parsed.href, args[1] ?? null);
    return;
  }

  const results = await Github.searchRepositories(query);
  if (!results?.length) {
    console.log(chalk.yellow('No repositories found'));
    process.exit(1);
  }

  const { selectedRepo } = await inquirer.prompt({
    type: 'list',
    name: 'selectedRepo',
    message: 'Select a repository to download:',
    choices: results.map(repo => ({ name: formatRepoChoice(repo), value: repo })),
  });

  await handleRepoDownload(selectedRepo);
}

main();
