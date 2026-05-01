import chalk from 'chalk';
import { execSync } from 'child_process';

/**
 * Prints the git0 ASCII-art logo in cyan to stdout.
 *
 * Called at the start of every major CLI action so the user always sees the
 * branding regardless of which code path is entered.
 *
 * @example
 * printLogo();
 * //                 ___
 * //     __ _(_)‾|_ / _ \
 * //    / _  | | __| | | |
 * //   | (_| | | |_| |_| |
 * //    \__, |_|\__|\___/
 * //    |___/
 */
export function printLogo(): void {
  console.log(chalk.cyan(`                ___
    __ _(_)‾|_ / _ \\
   / _  | | __| | | |
  | (_| | | |_| |_| |
   \\__, |_|\\__|\\___/
   |___/`));
}

/**
 * Runs a shell command synchronously, inheriting the parent's stdio so output
 * streams directly to the terminal.
 *
 * Errors are swallowed silently by default because many install commands (e.g.
 * `bun run dev`) exit non-zero when a script is not defined, which should not
 * abort the overall setup flow.
 *
 * @param cmd       - Shell command string to execute.
 * @param showError - When `true`, prints a red failure message on non-zero exit.
 *
 * @example
 * exec('npm install');
 * exec('npm run build', true); // prints error if build fails
 */
export function exec(cmd: string, showError = false): void {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    if (showError) console.error(chalk.red(`❌ Failed: ${cmd}`));
  }
}
