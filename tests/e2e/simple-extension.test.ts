import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

describe('Poker Tab Analyzer Extension - Simple Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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

  describe('Extension Files', () => {
    it('should have all required extension files', () => {
      const extensionPath = path.resolve(__dirname, '../../dist/extension');
      
      expect(fs.existsSync(path.join(extensionPath, 'manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(extensionPath, 'background.js'))).toBe(true);
      expect(fs.existsSync(path.join(extensionPath, 'content.js'))).toBe(true);
      expect(fs.existsSync(path.join(extensionPath, 'popup.html'))).toBe(true);
      expect(fs.existsSync(path.join(extensionPath, 'popup.js'))).toBe(true);
    });

    it('should have valid manifest.json', () => {
      const manifestPath = path.resolve(__dirname, '../../dist/extension/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBe('Poker Tab Analyzer');
      expect(manifest.permissions).toContain('activeTab');
      expect(manifest.background.service_worker).toBe('background.js');
    });
  });

  describe('Popup Page', () => {
    it('should load popup.html correctly', async () => {
      const popupPath = path.resolve(__dirname, '../../dist/extension/popup.html');
      await page.goto(`file://${popupPath}`);
      
      const title = await page.title();
      expect(title).toBe('Poker Tab Analyzer');
      
      const heading = await page.$eval('h1', el => el.textContent);
      expect(heading).toBe('Poker Tab Analyzer');
      
      const toggleButton = await page.$('#toggle-btn');
      expect(toggleButton).toBeTruthy();
    });

    it('should have working analyze button', async () => {
      const popupPath = path.resolve(__dirname, '../../dist/extension/popup.html');
      await page.goto(`file://${popupPath}`);
      
      // Check button exists and is enabled
      const isDisabled = await page.$eval('#toggle-btn', (el) => (el as HTMLButtonElement).disabled);
      expect(isDisabled).toBe(false);
      
      // Click the button
      await page.click('#toggle-btn');
      
      // In a real extension context, this would trigger content script
      // For now, we just verify the button is clickable
    });
  });

  describe('Test Page', () => {
    it('should load test poker page', async () => {
      const testPagePath = path.resolve(__dirname, './test-page.html');
      await page.goto(`file://${testPagePath}`);
      
      const title = await page.$eval('h1', el => el.textContent);
      expect(title).toBe('Poker Test Table');
      
      // Check if cards are displayed
      const playerCards = await page.$$('.player-cards .card');
      expect(playerCards.length).toBeGreaterThan(0);
      
      const communityCards = await page.$$('.community-cards .card');
      // Test page starts with a pair hand, so there are community cards
      expect(communityCards.length).toBeGreaterThan(0);
    });

    it('should change hands when buttons are clicked', async () => {
      const testPagePath = path.resolve(__dirname, './test-page.html');
      await page.goto(`file://${testPagePath}`);
      
      // Click on "Royal Flush" button
      await page.click('button[onclick="setHand(\'royal-flush\')"]');
      
      // Check if cards are updated
      const playerCards = await page.$$eval('.player-cards .card', cards => 
        cards.map(card => card.getAttribute('data-card'))
      );
      expect(playerCards).toEqual(['AS', 'KS']);
      
      const communityCards = await page.$$eval('.community-cards .card', cards => 
        cards.map(card => card.getAttribute('data-card'))
      );
      expect(communityCards).toEqual(['QS', 'JS', '10S', '2H', '3D']);
    });
  });

  describe('Library Functions', () => {
    it('should have solver library file', async () => {
      const solverPath = path.resolve(__dirname, '../../dist/lib/solver.js');
      expect(fs.existsSync(solverPath)).toBe(true);
      
      // Check the file exports PokerSolver
      const solverContent = fs.readFileSync(solverPath, 'utf-8');
      expect(solverContent).toContain('export class PokerSolver');
    });

    it('should have detector library file', async () => {
      const detectorPath = path.resolve(__dirname, '../../dist/lib/detector.js');
      expect(fs.existsSync(detectorPath)).toBe(true);
      
      // Check the file exports PokerDetector
      const detectorContent = fs.readFileSync(detectorPath, 'utf-8');
      expect(detectorContent).toContain('export class PokerDetector');
    });
  });
});