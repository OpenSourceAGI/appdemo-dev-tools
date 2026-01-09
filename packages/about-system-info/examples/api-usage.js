/**
 * Example usage of the system-info API
 *
 * Run with: node examples/api-usage.js
 */

import { getSystemInfo } from '../dist/index.js';

// Example 1: Get all system information
async function example1() {
  console.log('=== Example 1: Get all system information ===\n');

  const info = await getSystemInfo();
  console.log(JSON.stringify(info, null, 2));
}

// Example 2: Get specific fields
async function example2() {
  console.log('\n=== Example 2: Get specific fields ===\n');

  const info = await getSystemInfo();

  console.log('User:', info.user);
  console.log('Hostname:', info.hostname);
  console.log('OS:', info.os);
  console.log('CPU:', info.cpu);
  console.log('RAM Used:', info.ram_used);
  console.log('Disk Used:', info.disk_used);
}

// Example 3: Get network information
async function example3() {
  console.log('\n=== Example 3: Network information ===\n');

  const info = await getSystemInfo();

  console.log('Public IP:', info.ip);
  console.log('Local IP:', info.iplocal);
  console.log('City:', info.city);
  console.log('ISP:', info.isp);
}

// Example 4: Get hardware information
async function example4() {
  console.log('\n=== Example 4: Hardware information ===\n');

  const info = await getSystemInfo();

  console.log('Device:', info.device);
  console.log('CPU:', info.cpu);
  console.log('GPU:', info.gpu);
  console.log('Kernel:', info.kernel);
  console.log('Temperature:', info.temperature || 'N/A');
  console.log('Battery:', info.battery || 'N/A');
}

// Example 5: Monitor system resources
async function example5() {
  console.log('\n=== Example 5: Monitor resources (5 samples) ===\n');

  for (let i = 0; i < 5; i++) {
    const info = await getSystemInfo();
    console.log(`Sample ${i + 1}:`);
    console.log(`  RAM: ${info.ram_used}`);
    console.log(`  Disk: ${info.disk_used}`);
    console.log(`  Top Process: ${info.top_process}`);
    console.log(`  Uptime: ${info.uptime}\n`);

    // Wait 2 seconds between samples
    if (i < 4) await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Run all examples
async function main() {
  // Run first 4 examples quickly
  await example2();
  await example3();
  await example4();

  // Optionally run monitoring example (takes ~10 seconds)
  // Uncomment to enable:
  // await example5();
}

main().catch(console.error);
