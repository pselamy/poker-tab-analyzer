/**
 * Template matching for card detection
 */

export interface Template {
  rank: string;
  suit: string;
  imageData: ImageData;
}

export class TemplateMatcher {
  private templates: Template[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.generateTemplates();
  }

  /**
   * Generate template images for all cards
   */
  private generateTemplates() {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suits = ['♠', '♥', '♦', '♣'];
    
    // Template size - adjust based on typical card size in screenshots
    const width = 60;
    const height = 80;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    for (const rank of ranks) {
      for (const suit of suits) {
        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw border
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // Draw rank and suit
        this.ctx.fillStyle = (suit === '♥' || suit === '♦') ? 'red' : 'black';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Draw rank
        this.ctx.fillText(rank, width / 2, height / 3);
        
        // Draw suit
        this.ctx.font = '28px Arial';
        this.ctx.fillText(suit, width / 2, height * 2 / 3);
        
        // Store template
        const imageData = this.ctx.getImageData(0, 0, width, height);
        this.templates.push({
          rank,
          suit,
          imageData
        });
      }
    }
  }

  /**
   * Match a region against all templates
   */
  matchCard(regionImageData: ImageData): { rank: string; suit: string; confidence: number } | null {
    let bestMatch = {
      rank: '',
      suit: '',
      confidence: 0
    };
    
    // Resize region to template size if needed
    const resized = this.resizeImageData(regionImageData, 60, 80);
    
    for (const template of this.templates) {
      const similarity = this.calculateSimilarity(resized, template.imageData);
      
      if (similarity > bestMatch.confidence) {
        bestMatch = {
          rank: template.rank,
          suit: template.suit,
          confidence: similarity
        };
      }
    }
    
    // Require minimum confidence
    if (bestMatch.confidence > 0.7) {
      return bestMatch;
    }
    
    return null;
  }

  /**
   * Resize image data to target dimensions
   */
  private resizeImageData(imageData: ImageData, targetWidth: number, targetHeight: number): ImageData {
    // Create temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Put original image data
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Create output canvas
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;
    
    // Draw scaled image
    this.ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
    
    return this.ctx.getImageData(0, 0, targetWidth, targetHeight);
  }

  /**
   * Calculate similarity between two images using normalized cross-correlation
   */
  private calculateSimilarity(img1: ImageData, img2: ImageData): number {
    if (img1.width !== img2.width || img1.height !== img2.height) {
      return 0;
    }
    
    const data1 = img1.data;
    const data2 = img2.data;
    
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    
    // Convert to grayscale and calculate correlation
    for (let i = 0; i < data1.length; i += 4) {
      // Grayscale values
      const gray1 = (data1[i] + data1[i + 1] + data1[i + 2]) / 3;
      const gray2 = (data2[i] + data2[i + 1] + data2[i + 2]) / 3;
      
      sum1 += gray1;
      sum2 += gray2;
      sum1Sq += gray1 * gray1;
      sum2Sq += gray2 * gray2;
      pSum += gray1 * gray2;
    }
    
    const numPixels = data1.length / 4;
    const num = pSum - (sum1 * sum2 / numPixels);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / numPixels) * (sum2Sq - sum2 * sum2 / numPixels));
    
    if (den === 0) return 0;
    
    return Math.max(0, Math.min(1, num / den));
  }

  /**
   * Get all templates for testing
   */
  getTemplates(): Template[] {
    return this.templates;
  }
}