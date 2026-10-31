import { chromium } from 'playwright-core';
export function launchBrowser() {
  return chromium.launch({
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist'],
  });
}
