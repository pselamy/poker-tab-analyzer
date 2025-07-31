import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

describe('Poker Tab Analyzer Extension - CI Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    // Use headless mode for CI
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer'
      ]
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Build Verification', () => {
    it('should have a complete extension build', () => {
      const extensionPath = path.resolve(__dirname, '../../dist/extension');
      const requiredFiles = [
        'manifest.json',
        'background.js',
        'content.js',
        'popup.html',
        'popup.js',
        'popup.css',
        'icon16.png',
        'icon48.png',
        'icon128.png'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(extensionPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have valid JavaScript files', () => {
      const jsFiles = [
        'dist/extension/background.js',
        'dist/extension/content.js',
        'dist/extension/popup.js',
        'dist/lib/solver.js',
        'dist/lib/detector.js',
        'dist/lib/vision.js'
      ];

      jsFiles.forEach(file => {
        const filePath = path.resolve(__dirname, '../../', file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for common JS errors
        expect(content).not.toContain('undefined is not a function');
        expect(content).not.toContain('Unexpected token');
        
        // Verify it's valid JavaScript by checking for basic structure
        expect(content.length).toBeGreaterThan(100);
      });
    });
  });

  describe('Manifest Validation', () => {
    it('should have all required manifest fields', () => {
      const manifestPath = path.resolve(__dirname, '../../dist/extension/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // Required fields
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBeTruthy();
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
      
      // Permissions
      expect(Array.isArray(manifest.permissions)).toBe(true);
      expect(manifest.permissions).toContain('activeTab');
      
      // Background service worker
      expect(manifest.background).toBeTruthy();
      expect(manifest.background.service_worker).toBe('background.js');
      
      // Action (popup)
      expect(manifest.action).toBeTruthy();
      expect(manifest.action.default_popup).toBe('popup.html');
      
      // Icons
      expect(manifest.icons).toBeTruthy();
      expect(manifest.icons['16']).toBeTruthy();
      expect(manifest.icons['48']).toBeTruthy();
      expect(manifest.icons['128']).toBeTruthy();
    });
  });

  describe('Popup Functionality', () => {
    it('should render popup without errors', async () => {
      const popupPath = path.resolve(__dirname, '../../dist/extension/popup.html');
      
      // Set up console message handler to catch errors
      const consoleMessages: string[] = [];
      page.on('console', msg => consoleMessages.push(msg.text()));
      
      // Navigate to popup
      await page.goto(`file://${popupPath}`);
      
      // Wait for page to fully load
      await page.waitForFunction(() => document.readyState === 'complete');
      
      // Check for JavaScript errors
      const errorMessages = consoleMessages.filter(msg => 
        msg.includes('Error') || msg.includes('Uncaught')
      );
      expect(errorMessages).toEqual([]);
      
      // Verify basic structure
      const title = await page.title();
      expect(title).toBeTruthy();
      
      const hasToggleButton = await page.$('#toggle-btn') !== null;
      expect(hasToggleButton).toBe(true);
    });

    it('should have interactive elements', async () => {
      const popupPath = path.resolve(__dirname, '../../dist/extension/popup.html');
      await page.goto(`file://${popupPath}`);
      
      // Check toggle button
      const toggleButton = await page.$('#toggle-btn');
      expect(toggleButton).toBeTruthy();
      
      const buttonText = await page.$eval('#toggle-btn', el => el.textContent);
      expect(buttonText).toContain('Start Analysis');
      
      // Check interval input
      const intervalInput = await page.$('#interval');
      expect(intervalInput).toBeTruthy();
      
      const intervalValue = await page.$eval('#interval', el => (el as HTMLInputElement).value);
      expect(intervalValue).toBe('250');
      
      // Check other buttons
      const historyButton = await page.$('#history-btn');
      expect(historyButton).toBeTruthy();
      
      const settingsButton = await page.$('#settings-btn');
      expect(settingsButton).toBeTruthy();
    });
  });

  describe('Test Page Integration', () => {
    it('should render test poker page correctly', async () => {
      const testPagePath = path.resolve(__dirname, './test-page.html');
      await page.goto(`file://${testPagePath}`);
      
      // Verify page loaded
      const pageTitle = await page.$eval('h1', el => el.textContent);
      expect(pageTitle).toBe('Poker Test Table');
      
      // Check poker table elements
      const pokerTable = await page.$('.poker-table');
      expect(pokerTable).toBeTruthy();
      
      const pot = await page.$('#pot');
      expect(pot).toBeTruthy();
      
      // Verify test controls
      const testButtons = await page.$$('.test-controls button');
      expect(testButtons.length).toBe(10); // 10 different hand types
    });

    it('should update cards when test buttons are clicked', async () => {
      const testPagePath = path.resolve(__dirname, './test-page.html');
      await page.goto(`file://${testPagePath}`);
      
      // Test multiple hand types
      const handTypes = ['royal-flush', 'straight-flush', 'full-house'];
      
      for (const handType of handTypes) {
        await page.click(`button[onclick="setHand('${handType}')"]`);
        
        // Verify cards are updated
        const playerCards = await page.$$('.player-cards .card');
        expect(playerCards.length).toBe(2);
        
        const communityCards = await page.$$('.community-cards .card');
        expect(communityCards.length).toBe(5);
      }
    });
  });

  describe('Performance', () => {
    it('should load popup quickly', async () => {
      const popupPath = path.resolve(__dirname, '../../dist/extension/popup.html');
      
      const startTime = Date.now();
      await page.goto(`file://${popupPath}`);
      await page.waitForFunction(() => document.readyState === 'complete');
      const loadTime = Date.now() - startTime;
      
      // Popup should load in under 1 second
      expect(loadTime).toBeLessThan(1000);
    });

    it('should have reasonable file sizes', () => {
      const fileSizes = {
        'dist/extension/background.js': 50000, // 50KB
        'dist/extension/content.js': 50000,
        'dist/extension/popup.js': 50000,
        'dist/lib/solver.js': 100000, // 100KB
        'dist/lib/detector.js': 100000,
        'dist/lib/vision.js': 100000
      };

      Object.entries(fileSizes).forEach(([file, maxSize]) => {
        const filePath = path.resolve(__dirname, '../../', file);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeLessThan(maxSize);
      });
    });
  });
});