import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import os from 'os';

// We re-import after mocking, so keep a reference to the real values.
const realPlatform = os.platform();
const realArch = os.arch();

describe('getCurrentPlatform', () => {
  // Helper: dynamically re-import the module so mocks apply fresh each time.
  async function load() {
    const mod = await import('../src/platform.ts?t=' + Date.now());
    return mod.getCurrentPlatform;
  }

  test('maps darwin/x64 → macos/x86_64', async () => {
    mock.module('os', () => ({ default: { platform: () => 'darwin', arch: () => 'x64' } }));
    const fn = await load();
    const p = fn();
    expect(p.os).toBe('macos');
    expect(p.arch).toBe('x86_64');
    expect(p.platform).toBe('darwin');
    expect(p.architecture).toBe('x64');
  });

  test('maps win32/ia32 → windows/i386', async () => {
    mock.module('os', () => ({ default: { platform: () => 'win32', arch: () => 'ia32' } }));
    const fn = await load();
    const p = fn();
    expect(p.os).toBe('windows');
    expect(p.arch).toBe('i386');
  });

  test('maps linux/arm64 → linux/arm64', async () => {
    mock.module('os', () => ({ default: { platform: () => 'linux', arch: () => 'arm64' } }));
    const fn = await load();
    const p = fn();
    expect(p.os).toBe('linux');
    expect(p.arch).toBe('arm64');
  });

  test('maps darwin/arm64 → macos/arm64 (Apple Silicon)', async () => {
    mock.module('os', () => ({ default: { platform: () => 'darwin', arch: () => 'arm64' } }));
    const fn = await load();
    const p = fn();
    expect(p.os).toBe('macos');
    expect(p.arch).toBe('arm64');
  });

  test('passes through unknown platform/arch as-is', async () => {
    mock.module('os', () => ({ default: { platform: () => 'freebsd', arch: () => 'mips' } }));
    const fn = await load();
    const p = fn();
    expect(p.os).toBe('freebsd');
    expect(p.arch).toBe('mips');
  });

  test('returns raw platform and architecture fields alongside mapped ones', async () => {
    mock.module('os', () => ({ default: { platform: () => 'linux', arch: () => 'x64' } }));
    const fn = await load();
    const p = fn();
    expect(p.platform).toBe('linux');
    expect(p.architecture).toBe('x64');
  });
});
