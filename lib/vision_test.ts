/**
 * Tests for VisionUtils
 */

import { VisionUtils, Point, ColorRange } from "./vision";

describe("VisionUtils", () => {
  describe("toGrayscale", () => {
    it("should convert color image to grayscale", () => {
      const imageData = createColorImageData(10, 10, [255, 0, 0, 255]); // Red
      const gray = VisionUtils.toGrayscale(imageData);

      expect(gray.length).toBe(100);

      // Red converts to ~76 in grayscale
      for (const value of gray) {
        expect(value).toBeCloseTo(76, 0);
      }
    });

    it("should handle various colors correctly", () => {
      const testCases = [
        { color: [255, 255, 255, 255], expected: 255 }, // White
        { color: [0, 0, 0, 255], expected: 0 }, // Black
        { color: [255, 0, 0, 255], expected: 76 }, // Red
        { color: [0, 255, 0, 255], expected: 150 }, // Green
        { color: [0, 0, 255, 255], expected: 29 }, // Blue
      ];

      for (const testCase of testCases) {
        const imageData = createColorImageData(1, 1, testCase.color as any);
        const gray = VisionUtils.toGrayscale(imageData);
        expect(gray[0]).toBeCloseTo(testCase.expected, 0);
      }
    });
  });

  describe("threshold", () => {
    it("should create binary image", () => {
      const gray = new Uint8Array([0, 50, 100, 150, 200, 250]);
      const binary = VisionUtils.threshold(gray, 128);

      expect(binary[0]).toBe(0);
      expect(binary[1]).toBe(0);
      expect(binary[2]).toBe(0);
      expect(binary[3]).toBe(255);
      expect(binary[4]).toBe(255);
      expect(binary[5]).toBe(255);
    });

    it("should use default threshold", () => {
      const gray = new Uint8Array([100, 150]);
      const binary = VisionUtils.threshold(gray);

      expect(binary[0]).toBe(0);
      expect(binary[1]).toBe(255);
    });
  });

  describe("findContours", () => {
    it("should find contours in simple shape", () => {
      // Create a 10x10 image with a square in the middle
      const binary = new Uint8Array(100);

      // Draw a 4x4 square starting at (3,3)
      for (let y = 3; y < 7; y++) {
        for (let x = 3; x < 7; x++) {
          binary[y * 10 + x] = 255;
        }
      }

      const contours = VisionUtils.findContours(binary, 10, 10);

      expect(contours.length).toBe(1);
      expect(contours[0].length).toBeGreaterThan(10);
    });

    it("should filter small contours", () => {
      const binary = new Uint8Array(100);

      // Add a single pixel
      binary[50] = 255;

      const contours = VisionUtils.findContours(binary, 10, 10);

      expect(contours.length).toBe(0);
    });

    it("should find multiple contours", () => {
      const binary = new Uint8Array(400); // 20x20

      // Draw two separate squares
      for (let y = 2; y < 6; y++) {
        for (let x = 2; x < 6; x++) {
          binary[y * 20 + x] = 255;
        }
      }

      for (let y = 12; y < 16; y++) {
        for (let x = 12; x < 16; x++) {
          binary[y * 20 + x] = 255;
        }
      }

      const contours = VisionUtils.findContours(binary, 20, 20);

      expect(contours.length).toBe(2);
    });
  });

  describe("boundingBox", () => {
    it("should calculate correct bounding box", () => {
      const contour: Point[] = [
        { x: 5, y: 10 },
        { x: 15, y: 10 },
        { x: 15, y: 20 },
        { x: 5, y: 20 },
      ];

      const bbox = VisionUtils.boundingBox(contour);

      expect(bbox.x).toBe(5);
      expect(bbox.y).toBe(10);
      expect(bbox.width).toBe(11);
      expect(bbox.height).toBe(11);
    });

    it("should handle single point", () => {
      const contour: Point[] = [{ x: 10, y: 20 }];
      const bbox = VisionUtils.boundingBox(contour);

      expect(bbox.x).toBe(10);
      expect(bbox.y).toBe(20);
      expect(bbox.width).toBe(1);
      expect(bbox.height).toBe(1);
    });
  });

  describe("isInColorRange", () => {
    it("should check color within range", () => {
      const range: ColorRange = {
        minR: 200,
        maxR: 255,
        minG: 0,
        maxG: 50,
        minB: 0,
        maxB: 50,
      };

      expect(VisionUtils.isInColorRange(220, 30, 30, range)).toBe(true);
      expect(VisionUtils.isInColorRange(255, 0, 0, range)).toBe(true);
      expect(VisionUtils.isInColorRange(190, 30, 30, range)).toBe(false);
      expect(VisionUtils.isInColorRange(220, 60, 30, range)).toBe(false);
    });
  });

  describe("histogram", () => {
    it("should calculate histogram", () => {
      const gray = new Uint8Array([0, 0, 128, 128, 128, 255]);
      const hist = VisionUtils.histogram(gray);

      expect(hist.length).toBe(256);
      expect(hist[0]).toBe(2);
      expect(hist[128]).toBe(3);
      expect(hist[255]).toBe(1);
      expect(hist[100]).toBe(0);
    });
  });

  describe("otsuThreshold", () => {
    it("should find optimal threshold", () => {
      // Create bimodal distribution
      const gray = new Uint8Array(200);

      // Half dark pixels
      for (let i = 0; i < 100; i++) {
        gray[i] = Math.floor(Math.random() * 50);
      }

      // Half bright pixels
      for (let i = 100; i < 200; i++) {
        gray[i] = 200 + Math.floor(Math.random() * 50);
      }

      const threshold = VisionUtils.otsuThreshold(gray);

      expect(threshold).toBeGreaterThan(50);
      expect(threshold).toBeLessThan(200);
    });

    it("should handle uniform distribution", () => {
      const gray = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        gray[i] = i;
      }

      const threshold = VisionUtils.otsuThreshold(gray);

      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThan(256);
    });
  });
});

// Helper functions

function createColorImageData(
  width: number,
  height: number,
  color: [number, number, number, number],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }

  return new ImageData(data, width, height);
}
