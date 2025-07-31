import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

export interface TestContext {
  browser: Browser;
  page: Page;
}

export async function setupBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--disable-extensions-except=${getExtensionPath()}`,
      `--load-extension=${getExtensionPath()}`,
    ],
  });
  
  return browser;
}

export async function createExtensionPage(browser: Browser): Promise<Page> {
  // Get the extension ID
  const targets = await browser.targets();
  const extensionTarget = targets.find((target) => 
    target.type() === 'service_worker' && 
    target.url().startsWith('chrome-extension://')
  );
  
  if (!extensionTarget) {
    throw new Error('Extension not found. Make sure the extension is built.');
  }
  
  const extensionId = new URL(extensionTarget.url()).hostname;
  
  // Open the extension popup
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  
  return page;
}

export async function loadTestPage(page: Page, testPagePath: string): Promise<void> {
  const absolutePath = path.resolve(testPagePath);
  await page.goto(`file://${absolutePath}`);
}

export function getExtensionPath(): string {
  const distPath = path.resolve(__dirname, '../../dist/extension');
  if (!fs.existsSync(distPath)) {
    throw new Error('Extension not built. Run "npm run build" first.');
  }
  return distPath;
}

export async function teardownBrowser(browser: Browser): Promise<void> {
  await browser.close();
}