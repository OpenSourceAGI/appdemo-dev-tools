/**
 * Network utilities for IP information fetching
 * @module network
 */

import https from "https";
import {
  DEFAULT_IPINFO_TOKEN,
  DEFAULT_NETWORK_TIMEOUT,
} from "../cache/cache-config";

/**
 * IP information from ipinfo.io API
 * @interface IPInfo
 */
export interface IPInfo {
  /** Public IP address */
  ip?: string;
  /** City location */
  city?: string;
  /** Reverse DNS hostname */
  hostname?: string;
  /** ISP organization string (includes AS number) */
  org?: string;
}

/**
 * Fetches IP geolocation information from ipinfo.io API
 * @param {string} token - IPInfo.io API token
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<IPInfo>} IP information object or empty object on error
 */
export async function fetchIPInfo(
  token: string = DEFAULT_IPINFO_TOKEN,
  timeout: number = DEFAULT_NETWORK_TIMEOUT
): Promise<IPInfo> {
  return new Promise((resolve) => {
    const url = `https://ipinfo.io/json${token ? `?token=${token}` : ""}`;

    const req = https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    });

    req.on("error", () => resolve({}));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve({});
    });
  });
}
