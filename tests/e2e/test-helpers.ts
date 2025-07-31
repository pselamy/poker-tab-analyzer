import { Page } from 'puppeteer';

export async function waitForContentScript(page: Page, timeout = 5000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => window.hasOwnProperty('__pokerAnalyzerInjected'),
      { timeout }
    );
    return true;
  } catch (error) {
    return false;
  }
}

export async function createMockPokerPage(page: Page, cards: string[]): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock Poker Page</title>
      <style>
        .card-container {
          display: flex;
          gap: 10px;
          padding: 20px;
        }
        .card {
          width: 80px;
          height: 120px;
          border: 1px solid black;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: white;
        }
      </style>
    </head>
    <body>
      <h1>Poker Test Page</h1>
      <div class="card-container">
        ${cards.map(card => `<div class="card" data-card="${card}">${card}</div>`).join('')}
      </div>
    </body>
    </html>
  `);
}

export function parseCardNotation(card: string): { rank: string; suit: string } {
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  return { rank, suit };
}

export async function getAnalysisResults(page: Page): Promise<string> {
  return await page.$eval('#results', (el) => el.textContent || '');
}