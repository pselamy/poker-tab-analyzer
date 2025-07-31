/**
 * Generic poker table detector using computer vision
 */

export interface Card {
  rank: string;
  suit: string;
  confidence: number;
  bounds: Rectangle;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TableState {
  holeCards: Card[];
  communityCards: Card[];
  potSize: string;
  playerCount: number;
  dealerPosition: number;
  actionButtons: string[];
}

export class PokerDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Detect poker elements from a screenshot
   */
  async detectTable(imageData: ImageData): Promise<TableState> {
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.ctx.putImageData(imageData, 0, 0);

    const cards = await this.detectCards(imageData);
    const [holeCards, communityCards] = this.classifyCards(cards);
    
    return {
      holeCards,
      communityCards,
      potSize: await this.detectPotSize(imageData),
      playerCount: await this.detectPlayerCount(imageData),
      dealerPosition: await this.detectDealerButton(imageData),
      actionButtons: await this.detectActionButtons(imageData),
    };
  }

  /**
   * Find all card-like regions in the image
   */
  private async detectCards(imageData: ImageData): Promise<Card[]> {
    const regions = this.findWhiteRegions(imageData);
    const cardRegions = regions.filter(r => this.isCardShape(r));
    
    const cards: Card[] = [];
    for (const region of cardRegions) {
      const card = await this.recognizeCard(imageData, region);
      if (card) cards.push(card);
    }
    
    return cards;
  }

  /**
   * Find white/light rectangular regions
   */
  private findWhiteRegions(imageData: ImageData): Rectangle[] {
    const { data, width, height } = imageData;
    const visited = new Uint8Array(width * height);
    const regions: Rectangle[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (visited[idx]) continue;

        const pixelIdx = idx * 4;
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];

        // Check if pixel is white/light
        if (r > 240 && g > 240 && b > 240) {
          const region = this.floodFill(data, width, height, x, y, visited);
          if (region) regions.push(region);
        }
      }
    }

    return regions;
  }

  /**
   * Flood fill to find connected region
   */
  private floodFill(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: Uint8Array
  ): Rectangle | null {
    const stack = [[startX, startY]];
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    let pixelCount = 0;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) {
        continue;
      }

      const pixelIdx = idx * 4;
      const r = data[pixelIdx];
      const g = data[pixelIdx + 1];
      const b = data[pixelIdx + 2];

      if (r > 240 && g > 240 && b > 240) {
        visited[idx] = 1;
        pixelCount++;
        
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    // Filter out tiny regions
    if (pixelCount < 100) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  /**
   * Check if region has card-like aspect ratio
   */
  private isCardShape(region: Rectangle): boolean {
    const aspectRatio = region.width / region.height;
    return aspectRatio > 0.6 && aspectRatio < 0.8 && 
           region.width > 40 && region.height > 60;
  }

  /**
   * Recognize card rank and suit
   */
  private async recognizeCard(imageData: ImageData, bounds: Rectangle): Promise<Card | null> {
    // Extract card region
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = bounds.width;
    cardCanvas.height = bounds.height;
    const cardCtx = cardCanvas.getContext('2d')!;
    
    cardCtx.drawImage(
      this.canvas,
      bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height
    );

    // TODO: Implement actual OCR/template matching
    // For now, return mock data
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suits = ['♠', '♥', '♦', '♣'];
    
    return {
      rank: ranks[Math.floor(Math.random() * ranks.length)],
      suit: suits[Math.floor(Math.random() * suits.length)],
      confidence: 0.95,
      bounds,
    };
  }

  /**
   * Classify cards as hole cards or community cards
   */
  private classifyCards(cards: Card[]): [Card[], Card[]] {
    // Sort cards by Y position
    cards.sort((a, b) => a.bounds.y - b.bounds.y);

    // Cards in bottom half are likely hole cards
    const midY = Math.max(...cards.map(c => c.bounds.y)) / 2;
    
    const holeCards = cards.filter(c => c.bounds.y > midY);
    const communityCards = cards.filter(c => c.bounds.y <= midY);

    return [holeCards.slice(0, 2), communityCards.slice(0, 5)];
  }

  /**
   * Detect pot size using OCR
   */
  private async detectPotSize(imageData: ImageData): Promise<string> {
    // TODO: Implement OCR for pot size
    return "0";
  }

  /**
   * Detect number of players
   */
  private async detectPlayerCount(imageData: ImageData): Promise<number> {
    // TODO: Detect player avatars or chip stacks
    return 6;
  }

  /**
   * Find dealer button position
   */
  private async detectDealerButton(imageData: ImageData): Promise<number> {
    // TODO: Find circular dealer button
    return 1;
  }

  /**
   * Detect available action buttons
   */
  private async detectActionButtons(imageData: ImageData): Promise<string[]> {
    // TODO: Find and OCR action buttons
    return ["Fold", "Call", "Raise"];
  }
}