/**
 * Tests for PokerDetector
 */

import { test } from "node:test";
import assert from "node:assert";
import { PokerDetector } from "./detector.js";

// Mock DOM globals
global.document = {
  createElement: (tag: string) => {
    if (tag === "canvas") {
      return {
        getContext: () => ({
          drawImage: () => {},
          putImageData: () => {},
          getImageData: () => new ImageData(100, 100),
        }),
        width: 0,
        height: 0,
      };
    }
    return {};
  },
} as any;

global.ImageData = class ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(arg1: Uint8ClampedArray | number, arg2: number, arg3?: number) {
    if (arg1 instanceof Uint8ClampedArray) {
      this.data = arg1;
      this.width = arg2;
      this.height = arg3!;
    } else {
      this.width = arg1;
      this.height = arg2;
      this.data = new Uint8ClampedArray(arg1 * arg2 * 4);
    }
  }
} as any;

test("PokerDetector - should detect empty table", async () => {
  const detector = new PokerDetector();
  const imageData = new ImageData(800, 600);
  // Fill with white
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255;
    imageData.data[i + 1] = 255;
    imageData.data[i + 2] = 255;
    imageData.data[i + 3] = 255;
  }

  const result = await detector.detectTable(imageData);

  assert.deepStrictEqual(result.holeCards, []);
  assert.deepStrictEqual(result.communityCards, []);
  assert.strictEqual(result.potSize, "0");
});

test("PokerDetector - should detect game state", async () => {
  const detector = new PokerDetector();
  const imageData = new ImageData(1200, 800);

  const result = await detector.detectTable(imageData);

  assert.ok(result.playerCount > 0);
  assert.ok(result.playerCount <= 10);
  assert.ok(result.dealerPosition >= 0);
  assert.ok(Array.isArray(result.actionButtons));
});
