/**
 * Re-exports the IDE launcher and dependency installer from their dedicated
 * modules. Kept for backwards compatibility with any code that imported from
 * `setup.ts` directly.
 *
 * @module setup
 */
export { openInIDE } from './ide.js';
export { installDependencies } from './install.js';
