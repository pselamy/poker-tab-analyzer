/**
 * Tests for PokerDetector
 */

import { PokerDetector, Card, TableState } from "./detector";

describe("PokerDetector", () => {
  let detector: PokerDetector;

  beforeEach(() => {
    detector = new PokerDetector();
  });

  describe("detectTable", () => {
    it("should detect empty table", async () => {
      const imageData = createTestImageData(800, 600, [255, 255, 255, 255]);
      const result = await detector.detectTable(imageData);

      expect(result.holeCards).toEqual([]);
      expect(result.communityCards).toEqual([]);
      expect(result.potSize).toBe("0");
    });

    it("should detect cards in image", async () => {
      const imageData = createCardImageData();
      const result = await detector.detectTable(imageData);

      expect(result.holeCards.length).toBeGreaterThanOrEqual(0);
      expect(result.communityCards.length).toBeGreaterThanOrEqual(0);
    });

    it("should classify cards correctly", async () => {
      const imageData = createPokerTableImageData();
      const result = await detector.detectTable(imageData);

      // Hole cards should be in bottom half
      for (const card of result.holeCards) {
        expect(card.bounds.y).toBeGreaterThan(300);
      }

      // Community cards should be in top half
      for (const card of result.communityCards) {
        expect(card.bounds.y).toBeLessThanOrEqual(300);
      }
    });
  });

  describe("card detection", () => {
    it("should detect card regions", async () => {
      const imageData = createSingleCardImageData();
      const result = await detector.detectTable(imageData);
      const allCards = [...result.holeCards, ...result.communityCards];

      expect(allCards.length).toBeGreaterThan(0);

      const card = allCards[0];
      expect(card.rank).toMatch(/^[A2-9JQKT]0?$/);
      expect(card.suit).toMatch(/^[♠♥♦♣]$/);
      expect(card.confidence).toBeGreaterThan(0);
      expect(card.confidence).toBeLessThanOrEqual(1);
    });

    it("should detect card bounds correctly", async () => {
      const imageData = createSingleCardImageData();
      const result = await detector.detectTable(imageData);
      const allCards = [...result.holeCards, ...result.communityCards];

      if (allCards.length > 0) {
        const card = allCards[0];
        expect(card.bounds.width).toBeGreaterThan(40);
        expect(card.bounds.height).toBeGreaterThan(60);

        // Aspect ratio check
        const aspectRatio = card.bounds.width / card.bounds.height;
        expect(aspectRatio).toBeGreaterThan(0.6);
        expect(aspectRatio).toBeLessThan(0.8);
      }
    });
  });

  describe("game state detection", () => {
    it("should detect player count", async () => {
      const imageData = createPokerTableImageData();
      const result = await detector.detectTable(imageData);

      expect(result.playerCount).toBeGreaterThan(0);
      expect(result.playerCount).toBeLessThanOrEqual(10);
    });

    it("should detect dealer position", async () => {
      const imageData = createPokerTableImageData();
      const result = await detector.detectTable(imageData);

      expect(result.dealerPosition).toBeGreaterThanOrEqual(0);
      expect(result.dealerPosition).toBeLessThan(result.playerCount);
    });

    it("should detect action buttons", async () => {
      const imageData = createPokerTableImageData();
      const result = await detector.detectTable(imageData);

      expect(result.actionButtons).toBeInstanceOf(Array);

      const validActions = ["Fold", "Check", "Call", "Raise", "All In"];
      for (const action of result.actionButtons) {
        expect(validActions).toContain(action);
      }
    });
  });
});

// Helper functions

function createTestImageData(
  width: number,
  height: number,
  fillColor: [number, number, number, number],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = fillColor[0];
    data[i + 1] = fillColor[1];
    data[i + 2] = fillColor[2];
    data[i + 3] = fillColor[3];
  }

  return new ImageData(data, width, height);
}

function createCardImageData(): ImageData {
  const width = 800;
  const height = 600;
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with green background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 128;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }

  // Add white card rectangle
  drawRectangle(data, width, 100, 100, 70, 100, [255, 255, 255, 255]);

  return new ImageData(data, width, height);
}

function createSingleCardImageData(): ImageData {
  const width = 200;
  const height = 200;
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with dark background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 32;
    data[i + 1] = 32;
    data[i + 2] = 32;
    data[i + 3] = 255;
  }

  // Add white card in center
  drawRectangle(data, width, 65, 50, 70, 100, [255, 255, 255, 255]);

  return new ImageData(data, width, height);
}

function createPokerTableImageData(): ImageData {
  const width = 1200;
  const height = 800;
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with green table background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 100;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }

  // Add community cards in center
  for (let i = 0; i < 5; i++) {
    drawRectangle(
      data,
      width,
      400 + i * 80,
      250,
      70,
      100,
      [255, 255, 255, 255],
    );
  }

  // Add hole cards at bottom
  drawRectangle(data, width, 500, 600, 70, 100, [255, 255, 255, 255]);
  drawRectangle(data, width, 580, 600, 70, 100, [255, 255, 255, 255]);

  return new ImageData(data, width, height);
}

function drawRectangle(
  data: Uint8ClampedArray,
  imageWidth: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number, number],
) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const px = x + dx;
      const py = y + dy;
      const idx = (py * imageWidth + px) * 4;

      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = color[3];
    }
  }
}
