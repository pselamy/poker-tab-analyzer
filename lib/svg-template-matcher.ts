/**
 * Enhanced template matching using professional SVG cards
 * Uses svg-cards library for high-quality card templates
 */

export interface SVGTemplate {
  rank: string;
  suit: string;
  imageData: ImageData;
  svg: string;
}

export class SVGTemplateMatcher {
  private templates: Map<string, SVGTemplate> = new Map();
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Multiple sizes for better matching at different scales
  private templateSizes = [
    { width: 40, height: 60 },   // Small cards
    { width: 60, height: 90 },   // Medium cards
    { width: 80, height: 120 },  // Large cards
  ];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Initialize templates - must be called after DOM is ready
   */
  async initialize() {
    await this.generateSVGTemplates();
  }

  /**
   * Generate templates from SVG cards
   * Using naming convention from svg-cards library
   */
  private async generateSVGTemplates() {
    const suits = [
      { symbol: '♠', name: 'spade' },
      { symbol: '♥', name: 'heart' },
      { symbol: '♦', name: 'diamond' },
      { symbol: '♣', name: 'club' }
    ];
    
    const ranks = [
      { display: 'A', value: '1' },
      { display: '2', value: '2' },
      { display: '3', value: '3' },
      { display: '4', value: '4' },
      { display: '5', value: '5' },
      { display: '6', value: '6' },
      { display: '7', value: '7' },
      { display: '8', value: '8' },
      { display: '9', value: '9' },
      { display: '10', value: '10' },
      { display: 'J', value: 'jack' },
      { display: 'Q', value: 'queen' },
      { display: 'K', value: 'king' }
    ];

    for (const suit of suits) {
      for (const rank of ranks) {
        // SVG card ID format: "heart_1", "spade_king", etc.
        const cardId = `${suit.name}_${rank.value}`;
        
        // Generate templates at multiple sizes
        for (const size of this.templateSizes) {
          const key = `${rank.display}${suit.symbol}_${size.width}x${size.height}`;
          
          // Create SVG element
          const svg = this.createCardSVG(cardId, size.width, size.height);
          
          // Render to canvas
          const imageData = await this.svgToImageData(svg, size.width, size.height);
          
          this.templates.set(key, {
            rank: rank.display,
            suit: suit.symbol,
            imageData,
            svg
          });
        }
      }
    }
  }

  /**
   * Create SVG element for a card
   */
  private createCardSVG(cardId: string, width: number, height: number): string {
    // For now, create a simple representation
    // In production, would load actual SVG from svg-cards library
    const [suitName, rankValue] = cardId.split('_');
    const suit = suitName === 'spade' ? '♠' : 
                 suitName === 'heart' ? '♥' :
                 suitName === 'diamond' ? '♦' : '♣';
    const rank = rankValue === '1' ? 'A' :
                 rankValue === 'jack' ? 'J' :
                 rankValue === 'queen' ? 'Q' :
                 rankValue === 'king' ? 'K' : rankValue;
    
    const color = (suit === '♥' || suit === '♦') ? '#ff0000' : '#000000';
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="white" stroke="black" stroke-width="2"/>
        <text x="${width/2}" y="${height/3}" text-anchor="middle" 
              font-size="${width/3}" font-weight="bold" fill="${color}">${rank}</text>
        <text x="${width/2}" y="${height*2/3}" text-anchor="middle" 
              font-size="${width/2.5}" fill="${color}">${suit}</text>
      </svg>
    `;
  }

  /**
   * Convert SVG to ImageData
   */
  private async svgToImageData(svg: string, width: number, height: number): Promise<ImageData> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(img, 0, 0, width, height);
        resolve(this.ctx.getImageData(0, 0, width, height));
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svg);
    });
  }

  /**
   * Match a card region using multi-scale template matching
   */
  async matchCard(regionImageData: ImageData): Promise<{ rank: string; suit: string; confidence: number } | null> {
    let bestMatch = {
      rank: '',
      suit: '',
      confidence: 0
    };
    
    // Try matching at different scales
    for (const size of this.templateSizes) {
      const resized = await this.resizeImageData(regionImageData, size.width, size.height);
      
      // Try all templates at this size
      for (const [key, template] of this.templates) {
        if (!key.endsWith(`${size.width}x${size.height}`)) continue;
        
        const similarity = this.calculateSimilarity(resized, template.imageData);
        
        if (similarity > bestMatch.confidence) {
          bestMatch = {
            rank: template.rank,
            suit: template.suit,
            confidence: similarity
          };
        }
      }
    }
    
    // Use adaptive threshold based on image quality
    const threshold = this.calculateAdaptiveThreshold(regionImageData);
    
    if (bestMatch.confidence > threshold) {
      return bestMatch;
    }
    
    return null;
  }

  /**
   * Calculate adaptive threshold based on image characteristics
   */
  private calculateAdaptiveThreshold(imageData: ImageData): number {
    const { data } = imageData;
    let contrast = 0;
    let brightness = 0;
    
    // Sample pixels to estimate image quality
    const sampleSize = Math.min(1000, data.length / 4);
    const step = Math.floor(data.length / 4 / sampleSize);
    
    for (let i = 0; i < data.length; i += step * 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      brightness += gray;
    }
    
    brightness /= sampleSize * 255;
    
    // Lower threshold for low contrast/brightness images
    if (brightness < 0.3 || brightness > 0.7) {
      return 0.65;
    }
    
    return 0.75;
  }

  /**
   * Enhanced similarity calculation with edge detection
   */
  private calculateSimilarity(img1: ImageData, img2: ImageData): number {
    if (img1.width !== img2.width || img1.height !== img2.height) {
      return 0;
    }
    
    // Apply edge detection for better matching
    const edges1 = this.detectEdges(img1);
    const edges2 = this.detectEdges(img2);
    
    // Calculate normalized cross-correlation on edge maps
    return this.normalizedCrossCorrelation(edges1, edges2);
  }

  /**
   * Simple edge detection using Sobel operator
   */
  private detectEdges(imageData: ImageData): Uint8Array {
    const { data, width, height } = imageData;
    const edges = new Uint8Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Sobel X
        const gx = 
          -1 * this.getPixelGray(data, x-1, y-1, width) +
           1 * this.getPixelGray(data, x+1, y-1, width) +
          -2 * this.getPixelGray(data, x-1, y, width) +
           2 * this.getPixelGray(data, x+1, y, width) +
          -1 * this.getPixelGray(data, x-1, y+1, width) +
           1 * this.getPixelGray(data, x+1, y+1, width);
        
        // Sobel Y
        const gy = 
          -1 * this.getPixelGray(data, x-1, y-1, width) +
          -2 * this.getPixelGray(data, x, y-1, width) +
          -1 * this.getPixelGray(data, x+1, y-1, width) +
           1 * this.getPixelGray(data, x-1, y+1, width) +
           2 * this.getPixelGray(data, x, y+1, width) +
           1 * this.getPixelGray(data, x+1, y+1, width);
        
        edges[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      }
    }
    
    return edges;
  }

  /**
   * Get grayscale value of pixel
   */
  private getPixelGray(data: Uint8ClampedArray, x: number, y: number, width: number): number {
    const idx = (y * width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  }

  /**
   * Normalized cross-correlation
   */
  private normalizedCrossCorrelation(data1: Uint8Array, data2: Uint8Array): number {
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    
    for (let i = 0; i < data1.length; i++) {
      sum1 += data1[i];
      sum2 += data2[i];
      sum1Sq += data1[i] * data1[i];
      sum2Sq += data2[i] * data2[i];
      pSum += data1[i] * data2[i];
    }
    
    const n = data1.length;
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    if (den === 0) return 0;
    
    return Math.max(0, Math.min(1, num / den));
  }

  /**
   * Resize image data with bilinear interpolation
   */
  private async resizeImageData(imageData: ImageData, targetWidth: number, targetHeight: number): Promise<ImageData> {
    // Create temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Put original image data
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Create output canvas with smoothing
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Draw scaled image
    this.ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
    
    return this.ctx.getImageData(0, 0, targetWidth, targetHeight);
  }
}