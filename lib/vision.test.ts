/**
 * Tests for VisionUtils
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { VisionUtils } from './vision.js';

// Polyfill ImageData for tests
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

test('VisionUtils - toGrayscale should convert color to grayscale', () => {
  const imageData = new ImageData(2, 2);
  // Set to red
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255;     // R
    imageData.data[i + 1] = 0;   // G
    imageData.data[i + 2] = 0;   // B
    imageData.data[i + 3] = 255; // A
  }
  
  const gray = VisionUtils.toGrayscale(imageData);
  
  assert.strictEqual(gray.length, 4);
  // Red converts to ~76 in grayscale
  assert.ok(Math.abs(gray[0] - 76) < 1);
});

test('VisionUtils - threshold should create binary image', () => {
  const gray = new Uint8Array([0, 50, 100, 150, 200, 250]);
  const binary = VisionUtils.threshold(gray, 128);
  
  assert.strictEqual(binary[0], 0);
  assert.strictEqual(binary[1], 0);
  assert.strictEqual(binary[2], 0);
  assert.strictEqual(binary[3], 255);
  assert.strictEqual(binary[4], 255);
  assert.strictEqual(binary[5], 255);
});

test('VisionUtils - boundingBox should calculate correct bounds', () => {
  const contour = [
    { x: 5, y: 10 },
    { x: 15, y: 10 },
    { x: 15, y: 20 },
    { x: 5, y: 20 },
  ];
  
  const bbox = VisionUtils.boundingBox(contour);
  
  assert.strictEqual(bbox.x, 5);
  assert.strictEqual(bbox.y, 10);
  assert.strictEqual(bbox.width, 11);
  assert.strictEqual(bbox.height, 11);
});

test('VisionUtils - isInColorRange should check color ranges', () => {
  const range = {
    minR: 200, maxR: 255,
    minG: 0, maxG: 50,
    minB: 0, maxB: 50,
  };
  
  assert.strictEqual(VisionUtils.isInColorRange(220, 30, 30, range), true);
  assert.strictEqual(VisionUtils.isInColorRange(255, 0, 0, range), true);
  assert.strictEqual(VisionUtils.isInColorRange(190, 30, 30, range), false);
  assert.strictEqual(VisionUtils.isInColorRange(220, 60, 30, range), false);
});

test('VisionUtils - histogram should calculate distribution', () => {
  const gray = new Uint8Array([0, 0, 128, 128, 128, 255]);
  const hist = VisionUtils.histogram(gray);
  
  assert.strictEqual(hist.length, 256);
  assert.strictEqual(hist[0], 2);
  assert.strictEqual(hist[128], 3);
  assert.strictEqual(hist[255], 1);
  assert.strictEqual(hist[100], 0);
});