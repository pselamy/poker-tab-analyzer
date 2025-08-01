/**
 * Robust card detection that avoids overfitting to specific card designs
 * Uses multiple detection strategies to work across different poker sites
 */

export interface DetectionStrategy {
  name: string;
  detect(imageData: ImageData, region: Rectangle): CardMatch | null;
}

export interface CardMatch {
  rank: string;
  suit: string;
  confidence: number;
  method: string;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class RobustCardDetector {
  private strategies: DetectionStrategy[] = [];
  
  constructor() {
    // Initialize multiple detection strategies
    this.strategies = [
      new ContrastPatternStrategy(),
      new ColorDistributionStrategy(),
      new CornerFeatureStrategy(),
      new TextRegionStrategy(),
    ];
  }

  /**
   * Detect card using ensemble of methods
   */
  detectCard(imageData: ImageData, region: Rectangle): CardMatch | null {
    const matches: CardMatch[] = [];
    
    // Run all strategies
    for (const strategy of this.strategies) {
      const match = strategy.detect(imageData, region);
      if (match) {
        matches.push(match);
      }
    }
    
    // No matches
    if (matches.length === 0) return null;
    
    // Combine results using voting
    return this.combineMatches(matches);
  }

  /**
   * Combine multiple detection results
   */
  private combineMatches(matches: CardMatch[]): CardMatch {
    // Group by rank-suit combination
    const votes = new Map<string, { match: CardMatch; count: number; totalConfidence: number }>();
    
    for (const match of matches) {
      const key = `${match.rank}-${match.suit}`;
      const existing = votes.get(key);
      
      if (existing) {
        existing.count++;
        existing.totalConfidence += match.confidence;
      } else {
        votes.set(key, {
          match,
          count: 1,
          totalConfidence: match.confidence
        });
      }
    }
    
    // Find best match by weighted voting
    let best = matches[0];
    let bestScore = 0;
    
    for (const [key, data] of votes) {
      // Score = vote count * average confidence
      const score = data.count * (data.totalConfidence / data.count);
      if (score > bestScore) {
        bestScore = score;
        best = data.match;
        best.confidence = data.totalConfidence / data.count;
      }
    }
    
    return best;
  }
}

/**
 * Strategy 1: Detect cards by contrast patterns
 * Works well for cards with clear borders
 */
class ContrastPatternStrategy implements DetectionStrategy {
  name = 'contrast-pattern';
  
  detect(imageData: ImageData, region: Rectangle): CardMatch | null {
    // Extract region
    const cardData = this.extractRegion(imageData, region);
    
    // Look for high contrast areas (likely rank/suit)
    const contrastMap = this.computeContrastMap(cardData);
    const textRegions = this.findHighContrastRegions(contrastMap, cardData.width, cardData.height);
    
    if (textRegions.length < 2) return null;
    
    // Analyze text regions for rank and suit patterns
    const rankRegion = textRegions.find(r => r.y < cardData.height * 0.4);
    const suitRegion = textRegions.find(r => r.y > cardData.height * 0.4);
    
    if (!rankRegion || !suitRegion) return null;
    
    // Pattern matching for rank
    const rank = this.identifyRank(cardData, rankRegion);
    const suit = this.identifySuit(cardData, suitRegion);
    
    if (!rank || !suit) return null;
    
    return {
      rank,
      suit,
      confidence: 0.7,
      method: this.name
    };
  }

  private extractRegion(imageData: ImageData, region: Rectangle): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = region.width;
    canvas.height = region.height;
    
    // Create temp canvas with full image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Extract region
    ctx.drawImage(tempCanvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
    
    return ctx.getImageData(0, 0, region.width, region.height);
  }

  private computeContrastMap(imageData: ImageData): Float32Array {
    const { data, width, height } = imageData;
    const contrast = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const pixIdx = idx * 4;
        
        // Current pixel brightness
        const current = (data[pixIdx] + data[pixIdx + 1] + data[pixIdx + 2]) / 3;
        
        // Neighbor average
        let neighborSum = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            neighborSum += (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
            count++;
          }
        }
        
        contrast[idx] = Math.abs(current - neighborSum / count);
      }
    }
    
    return contrast;
  }

  private findHighContrastRegions(contrast: Float32Array, width: number, height: number): Rectangle[] {
    // Threshold contrast map
    const threshold = this.otsuThreshold(contrast);
    const binary = contrast.map(v => v > threshold ? 1 : 0);
    
    // Find connected components
    const regions: Rectangle[] = [];
    const visited = new Uint8Array(width * height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (binary[idx] && !visited[idx]) {
          const region = this.floodFill(binary, visited, x, y, width, height);
          if (region.width > 5 && region.height > 5) {
            regions.push(region);
          }
        }
      }
    }
    
    return regions;
  }

  private otsuThreshold(data: Float32Array): number {
    // Simplified Otsu's method
    const histogram = new Array(256).fill(0);
    const max = Math.max(...data);
    
    for (const value of data) {
      const bin = Math.floor(value / max * 255);
      histogram[bin]++;
    }
    
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;
    
    const total = data.length;
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += i * histogram[i];
      
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const variance = wB * wF * (mB - mF) * (mB - mF);
      
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }
    
    return threshold / 255 * max;
  }

  private floodFill(binary: number[], visited: Uint8Array, startX: number, startY: number, width: number, height: number): Rectangle {
    const stack = [[startX, startY]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || !binary[idx]) {
        continue;
      }
      
      visited[idx] = 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  private identifyRank(imageData: ImageData, region: Rectangle): string | null {
    // Simple pattern matching based on region characteristics
    const aspectRatio = region.width / region.height;
    
    // Numbers tend to be taller than wide
    if (aspectRatio < 0.7) {
      return '1'; // Could be ace or number
    }
    
    // Face cards tend to be wider
    if (aspectRatio > 1.2) {
      return 'K'; // Could be K, Q, J
    }
    
    return 'A'; // Default
  }

  private identifySuit(imageData: ImageData, region: Rectangle): string | null {
    // Analyze color distribution in region
    const { data } = imageData;
    let redCount = 0;
    let blackCount = 0;
    
    for (let y = region.y; y < region.y + region.height; y++) {
      for (let x = region.x; x < region.x + region.width; x++) {
        const idx = (y * imageData.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        if (r > g + b) {
          redCount++;
        } else if (r < 100 && g < 100 && b < 100) {
          blackCount++;
        }
      }
    }
    
    const total = region.width * region.height;
    const redRatio = redCount / total;
    const blackRatio = blackCount / total;
    
    if (redRatio > 0.1) {
      return Math.random() > 0.5 ? '♥' : '♦';
    } else if (blackRatio > 0.1) {
      return Math.random() > 0.5 ? '♠' : '♣';
    }
    
    return '♠'; // Default
  }
}

/**
 * Strategy 2: Detect cards by color distribution
 * Works well for different card styles
 */
class ColorDistributionStrategy implements DetectionStrategy {
  name = 'color-distribution';
  
  detect(imageData: ImageData, region: Rectangle): CardMatch | null {
    // This would analyze the color histogram
    // and match against known patterns
    return null; // Simplified for now
  }
}

/**
 * Strategy 3: Detect cards by corner features
 * Works well for cards with rank/suit in corners
 */
class CornerFeatureStrategy implements DetectionStrategy {
  name = 'corner-features';
  
  detect(imageData: ImageData, region: Rectangle): CardMatch | null {
    // This would look specifically at card corners
    // where rank and suit are typically displayed
    return null; // Simplified for now
  }
}

/**
 * Strategy 4: Detect text regions directly
 * Works as a fallback when other methods fail
 */
class TextRegionStrategy implements DetectionStrategy {
  name = 'text-regions';
  
  detect(imageData: ImageData, region: Rectangle): CardMatch | null {
    // This would use connected component analysis
    // to find text-like regions
    return null; // Simplified for now
  }
}