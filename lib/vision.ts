/**
 * Computer vision utilities for image processing
 */

export interface Point {
  x: number;
  y: number;
}

export interface ColorRange {
  minR: number;
  maxR: number;
  minG: number;
  maxG: number;
  minB: number;
  maxB: number;
}

export class VisionUtils {
  /**
   * Convert RGB to grayscale
   */
  static toGrayscale(imageData: ImageData): Uint8Array {
    const { data, width, height } = imageData;
    const gray = new Uint8Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Standard grayscale conversion
      gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }

    return gray;
  }

  /**
   * Apply threshold to create binary image
   */
  static threshold(gray: Uint8Array, threshold: number = 128): Uint8Array {
    const binary = new Uint8Array(gray.length);
    
    for (let i = 0; i < gray.length; i++) {
      binary[i] = gray[i] > threshold ? 255 : 0;
    }

    return binary;
  }

  /**
   * Find contours in binary image
   */
  static findContours(binary: Uint8Array, width: number, height: number): Point[][] {
    const visited = new Uint8Array(binary.length);
    const contours: Point[][] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        if (binary[idx] === 255 && !visited[idx]) {
          const contour = this.traceContour(binary, width, height, x, y, visited);
          if (contour.length > 10) { // Filter small contours
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  }

  /**
   * Trace contour using Moore neighborhood
   */
  private static traceContour(
    binary: Uint8Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: Uint8Array
  ): Point[] {
    const contour: Point[] = [];
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],           [1, 0],
      [-1, 1],  [0, 1],  [1, 1]
    ];

    let x = startX;
    let y = startY;
    let dir = 0;

    do {
      contour.push({ x, y });
      visited[y * width + x] = 1;

      // Find next contour point
      let found = false;
      for (let i = 0; i < 8; i++) {
        const nextDir = (dir + i) % 8;
        const dx = directions[nextDir][0];
        const dy = directions[nextDir][1];
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = ny * width + nx;
          if (binary[idx] === 255) {
            x = nx;
            y = ny;
            dir = (nextDir + 4) % 8; // Start from opposite direction
            found = true;
            break;
          }
        }
      }

      if (!found) break;
    } while (x !== startX || y !== startY || contour.length < 3);

    return contour;
  }

  /**
   * Calculate bounding box for contour
   */
  static boundingBox(contour: Point[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const point of contour) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  /**
   * Check if pixel is within color range
   */
  static isInColorRange(
    r: number,
    g: number,
    b: number,
    range: ColorRange
  ): boolean {
    return r >= range.minR && r <= range.maxR &&
           g >= range.minG && g <= range.maxG &&
           b >= range.minB && b <= range.maxB;
  }

  /**
   * Calculate image histogram
   */
  static histogram(gray: Uint8Array): number[] {
    const hist = new Array(256).fill(0);
    
    for (const value of gray) {
      hist[value]++;
    }

    return hist;
  }

  /**
   * Calculate Otsu's threshold
   */
  static otsuThreshold(gray: Uint8Array): number {
    const hist = this.histogram(gray);
    const total = gray.length;

    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * hist[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;

      wF = total - wB;
      if (wF === 0) break;

      sumB += t * hist[t];

      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }

    return threshold;
  }
}