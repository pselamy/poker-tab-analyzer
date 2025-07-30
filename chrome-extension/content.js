/**
 * Content script that runs on poker sites
 * Captures and analyzes poker table in real-time
 */

class PokerAnalyzer {
  constructor() {
    this.isRunning = false;
    this.captureInterval = 250; // milliseconds
    this.intervalId = null;
    this.lastDetection = null;
    this.canvas = null;
    this.ctx = null;
    
    // Card detection patterns
    this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    this.suits = ['c', 'd', 'h', 's'];
    
    this.init();
  }
  
  init() {
    // Create offscreen canvas for image processing
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'start') {
        this.start();
        sendResponse({status: 'started'});
      } else if (request.action === 'stop') {
        this.stop();
        sendResponse({status: 'stopped'});
      } else if (request.action === 'getStatus') {
        sendResponse({
          isRunning: this.isRunning,
          lastDetection: this.lastDetection
        });
      }
    });
    
    console.log('Poker Analyzer initialized on', window.location.hostname);
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting poker analysis...');
    
    // Start capture loop
    this.intervalId = setInterval(() => {
      this.captureAndAnalyze();
    }, this.captureInterval);
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Stopped poker analysis');
  }
  
  captureAndAnalyze() {
    const startTime = performance.now();
    
    // Find poker table element (varies by site)
    const tableElement = this.findPokerTable();
    if (!tableElement) {
      console.warn('Poker table not found');
      return;
    }
    
    // Capture table as image
    this.captureElement(tableElement).then(imageData => {
      // Analyze the image
      const detection = this.analyzePokerTable(imageData);
      
      if (detection.cards.length > 0 || detection.communityCards.length > 0) {
        this.lastDetection = detection;
        
        // Send to background for solver analysis
        chrome.runtime.sendMessage({
          action: 'analyze',
          detection: detection,
          site: window.location.hostname
        });
        
        // Log performance
        const elapsed = performance.now() - startTime;
        if (elapsed > 100) {
          console.warn(`Analysis took ${elapsed.toFixed(1)}ms`);
        }
      }
    }).catch(err => {
      console.error('Capture failed:', err);
    });
  }
  
  findPokerTable() {
    // Try different selectors for different sites
    const selectors = [
      // Global Poker
      '.table-container', '.poker-table', '#table',
      // PokerStars  
      '.table-wrapper', '.gameContainer',
      // GGPoker
      '.game-table', '.table-view',
      // Generic
      '[class*="table"]', '[id*="table"]',
      'canvas' // Some sites use canvas
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.offsetWidth > 400) {
        return element;
      }
    }
    
    // Fallback: find largest element that looks like a table
    const candidates = document.querySelectorAll('div, canvas');
    let largest = null;
    let largestArea = 0;
    
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const area = rect.width * rect.height;
      
      if (area > largestArea && rect.width > 600 && rect.height > 400) {
        largest = el;
        largestArea = area;
      }
    }
    
    return largest;
  }
  
  async captureElement(element) {
    // Get element bounds
    const rect = element.getBoundingClientRect();
    
    // Set canvas size
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Handle canvas elements
    if (element.tagName === 'CANVAS') {
      this.ctx.drawImage(element, 0, 0);
    } else {
      // For DOM elements, we need to use a different approach
      // Using html2canvas would be ideal, but for now we'll capture visible area
      await this.captureVisibleArea(rect);
    }
    
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
  
  async captureVisibleArea(rect) {
    // Request screenshot from background script
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'captureVisibleTab',
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      }, (response) => {
        if (response && response.imageData) {
          const img = new Image();
          img.onload = () => {
            this.ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.src = response.imageData;
        } else {
          resolve();
        }
      });
    });
  }
  
  analyzePokerTable(imageData) {
    const detection = {
      cards: [],
      communityCards: [],
      pot: null,
      timestamp: Date.now()
    };
    
    // Quick card detection using pattern matching
    const cards = this.detectCards(imageData);
    
    // Separate hole cards from community cards based on position
    cards.forEach(card => {
      if (card.y > imageData.height * 0.6) {
        // Likely hole cards (bottom of screen)
        detection.cards.push(card);
      } else if (card.y > imageData.height * 0.3 && card.y < imageData.height * 0.5) {
        // Likely community cards (center)
        detection.communityCards.push(card);
      }
    });
    
    // Detect pot size (simplified)
    detection.pot = this.detectPotSize(imageData);
    
    return detection;
  }
  
  detectCards(imageData) {
    const cards = [];
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Find all white/light rectangular regions (potential cards)
    const cardRegions = this.findCardLikeRegions(data, width, height);
    
    // Analyze each region to see if it's actually a card
    cardRegions.forEach(region => {
      const card = this.analyzeCardRegion(imageData, region);
      if (card) {
        cards.push(card);
      }
    });
    
    return cards;
  }
  
  findCardLikeRegions(data, width, height) {
    const regions = [];
    const visited = new Uint8Array(width * height);
    
    // Scan for white/light pixels that could be cards
    for (let y = 0; y < height; y += 5) {
      for (let x = 0; x < width; x += 5) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Check if pixel is white/light (potential card)
        if (r > 200 && g > 200 && b > 200 && !visited[y * width + x]) {
          const region = this.floodFillRegion(data, width, height, x, y, visited);
          
          if (region && this.isCardShaped(region)) {
            regions.push(region);
          }
        }
      }
    }
    
    return regions;
  }
  
  floodFillRegion(data, width, height, startX, startY, visited) {
    const queue = [{x: startX, y: startY}];
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    let pixelCount = 0;
    
    while (queue.length > 0) {
      const {x, y} = queue.shift();
      const idx = y * width + x;
      
      if (visited[idx]) continue;
      visited[idx] = 1;
      
      const pidx = idx * 4;
      const r = data[pidx];
      const g = data[pidx + 1];
      const b = data[pidx + 2];
      
      // Check if pixel is white/light
      if (r > 180 && g > 180 && b > 180) {
        pixelCount++;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        
        // Add neighbors
        if (x > 0) queue.push({x: x - 1, y});
        if (x < width - 1) queue.push({x: x + 1, y});
        if (y > 0) queue.push({x, y: y - 1});
        if (y < height - 1) queue.push({x, y: y + 1});
      }
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      pixelCount
    };
  }
  
  isCardShaped(region) {
    const aspectRatio = region.width / region.height;
    const area = region.width * region.height;
    const fillRatio = region.pixelCount / area;
    
    // Cards are typically 0.6-0.8 aspect ratio
    // Must be reasonably sized and mostly filled
    return aspectRatio > 0.5 && aspectRatio < 0.9 &&
           area > 1000 && 
           fillRatio > 0.7;
  }
  
  analyzeCardRegion(imageData, region) {
    // Extract the card region
    const cardData = this.extractRegion(imageData, region);
    
    // Look for rank and suit using pattern matching
    const rank = this.detectRank(cardData);
    const suit = this.detectSuit(cardData);
    
    if (rank) {
      return {
        rank,
        suit: suit || '?',
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height
      };
    }
    
    return null;
  }
  
  extractRegion(imageData, region) {
    const {x, y, width, height} = region;
    const regionData = new ImageData(width, height);
    
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const srcIdx = ((y + dy) * imageData.width + (x + dx)) * 4;
        const dstIdx = (dy * width + dx) * 4;
        
        regionData.data[dstIdx] = imageData.data[srcIdx];
        regionData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
        regionData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
        regionData.data[dstIdx + 3] = imageData.data[srcIdx + 3];
      }
    }
    
    return regionData;
  }
  
  detectRank(cardData) {
    // Look in top-left corner for rank
    const cornerWidth = Math.floor(cardData.width * 0.3);
    const cornerHeight = Math.floor(cardData.height * 0.3);
    
    // Convert to grayscale and threshold
    const binary = this.toBinaryImage(cardData, cornerWidth, cornerHeight);
    
    // Simple pattern matching for ranks
    const patterns = {
      'A': this.matchesA(binary, cornerWidth, cornerHeight),
      'K': this.matchesK(binary, cornerWidth, cornerHeight),
      'Q': this.matchesQ(binary, cornerWidth, cornerHeight),
      'J': this.matchesJ(binary, cornerWidth, cornerHeight),
      'T': this.matches10(binary, cornerWidth, cornerHeight),
      // For number cards, count vertical lines
      '2': this.countVerticalLines(binary, cornerWidth, cornerHeight) === 2,
      '3': this.countVerticalLines(binary, cornerWidth, cornerHeight) === 3,
      // Add more patterns as needed
    };
    
    for (const [rank, matches] of Object.entries(patterns)) {
      if (matches) return rank;
    }
    
    // Fallback: try to detect any number
    const num = this.detectNumber(binary, cornerWidth, cornerHeight);
    if (num >= 2 && num <= 9) return num.toString();
    
    return null;
  }
  
  toBinaryImage(imageData, width, height) {
    const binary = new Uint8Array(width * height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * imageData.width + x) * 4;
        const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
        binary[y * width + x] = gray < 128 ? 1 : 0;
      }
    }
    
    return binary;
  }
  
  detectSuit(cardData) {
    // Look below rank for suit symbol
    const suitY = Math.floor(cardData.height * 0.2);
    const suitHeight = Math.floor(cardData.height * 0.3);
    const suitWidth = Math.floor(cardData.width * 0.3);
    
    let redPixels = 0;
    let blackPixels = 0;
    
    for (let y = suitY; y < suitY + suitHeight; y++) {
      for (let x = 0; x < suitWidth; x++) {
        const idx = (y * cardData.width + x) * 4;
        const r = cardData.data[idx];
        const g = cardData.data[idx + 1];
        const b = cardData.data[idx + 2];
        
        if (r > 150 && g < 100 && b < 100) {
          redPixels++;
        } else if (r < 50 && g < 50 && b < 50) {
          blackPixels++;
        }
      }
    }
    
    // Simple suit detection based on color
    if (redPixels > blackPixels) {
      return redPixels > suitWidth * suitHeight * 0.1 ? 'h' : 'd';
    } else {
      return blackPixels > suitWidth * suitHeight * 0.1 ? 's' : 'c';
    }
  }
  
  // Simple pattern matching functions
  matchesA(binary, width, height) {
    // Look for A shape - triangle with horizontal line
    let matches = 0;
    const midY = Math.floor(height / 2);
    
    // Check for horizontal line in middle
    for (let x = width * 0.2; x < width * 0.8; x++) {
      if (binary[midY * width + Math.floor(x)]) matches++;
    }
    
    return matches > width * 0.4;
  }
  
  matchesK(binary, width, height) {
    // K has vertical line on left and diagonal
    let leftLine = 0;
    
    for (let y = height * 0.2; y < height * 0.8; y++) {
      if (binary[Math.floor(y) * width + Math.floor(width * 0.2)]) leftLine++;
    }
    
    return leftLine > height * 0.4;
  }
  
  matchesQ(binary, width, height) {
    // Q is circular with tail
    return false; // Simplified
  }
  
  matchesJ(binary, width, height) {
    // J has hook shape
    return false; // Simplified
  }
  
  matches10(binary, width, height) {
    // Look for "10" or "T"
    return this.countVerticalLines(binary, width, height) >= 2;
  }
  
  countVerticalLines(binary, width, height) {
    let lines = 0;
    let inLine = false;
    
    for (let x = 0; x < width; x++) {
      let blackPixels = 0;
      
      for (let y = height * 0.3; y < height * 0.7; y++) {
        if (binary[Math.floor(y) * width + x]) blackPixels++;
      }
      
      if (blackPixels > height * 0.2) {
        if (!inLine) {
          lines++;
          inLine = true;
        }
      } else {
        inLine = false;
      }
    }
    
    return lines;
  }
  
  detectNumber(binary, width, height) {
    // Simple number detection based on shape
    const lines = this.countVerticalLines(binary, width, height);
    if (lines >= 2 && lines <= 9) return lines;
    return 0;
  }
  
  detectPotSize(imageData) {
    // Look for text in center of image
    const centerX = imageData.width / 2;
    const centerY = imageData.height / 2;
    const searchWidth = imageData.width * 0.4;
    const searchHeight = imageData.height * 0.2;
    
    // For now, return null - would need OCR library
    return null;
  }
}

// Create and start analyzer
const analyzer = new PokerAnalyzer();

// Auto-start if on poker site
if (window.location.hostname.includes('poker') || 
    window.location.hostname.includes('globalpoker') ||
    window.location.hostname.includes('pokerstars')) {
  setTimeout(() => {
    console.log('Auto-starting poker analyzer...');
    analyzer.start();
  }, 2000);
}
