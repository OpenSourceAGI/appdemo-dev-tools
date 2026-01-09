/**
 * Verification script for System Info API
 */
import { getSystemInfo } from "./src/system-info-api.js";

async function verify() {
  console.log("Fetching system info...");
  const info = await getSystemInfo();

  console.log("--- API Verification ---");
  console.log(`Platform: ${info.platform}`);
  console.log(`OS: ${info.os}`);
  console.log(`CPU: ${info.cpu}`);
  console.log(`Memory: ${info.ram_used}`);
  console.log(`Packages: ${info.pacman}`);
  console.log(`Services: ${info.services_running}`);
  console.log(`Ports: ${info.ports}`);
  console.log(`Containers: ${info.containers}`);

  console.log("\nFull info structure keys:", Object.keys(info).join(", "));
}

verify().catch(console.error);
