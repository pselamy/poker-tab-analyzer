/**
 * Content script that runs on poker sites
 * Captures and analyzes poker table using screenshot approach
 */

class PokerAnalyzer {
  constructor() {
    this.isRunning = false;
    this.captureInterval = 500; // milliseconds - slower for screenshot approach
    this.intervalId = null;
    this.lastDetection = null;
    this.consecutiveFailures = 0;

    // Card detection patterns
    this.ranks = [
      "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A",
    ];
    this.suits = ["c", "d", "h", "s"];

    this.init();
  }

  init() {
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("[PokerAnalyzer] Received message:", request.action);
      
      if (request.action === "start") {
        this.start();
        sendResponse({ status: "started" });
      } else if (request.action === "stop") {
        this.stop();
        sendResponse({ status: "stopped" });
      } else if (request.action === "getStatus") {
        sendResponse({
          isRunning: this.isRunning,
          lastDetection: this.lastDetection,
        });
      } else if (request.action === "updateInterval") {
        this.captureInterval = request.interval;
        if (this.isRunning) {
          this.stop();
          this.start();
        }
      }
    });

    console.log("[PokerAnalyzer] Initialized on", window.location.hostname);
    console.log("[PokerAnalyzer] Page URL:", window.location.href);
  }

  start() {
    if (this.isRunning) {
      console.log("[PokerAnalyzer] Already running");
      return;
    }

    this.isRunning = true;
    this.consecutiveFailures = 0;
    console.log("[PokerAnalyzer] Starting analysis with interval:", this.captureInterval, "ms");

    // Start capture loop
    this.intervalId = setInterval(() => {
      this.captureAndAnalyze();
    }, this.captureInterval);
    
    // Initial capture
    this.captureAndAnalyze();
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("[PokerAnalyzer] Stopped analysis");
  }

  captureAndAnalyze() {
    const startTime = performance.now();
    console.log("[PokerAnalyzer] Requesting screenshot...");

    // Request screenshot from background script
    chrome.runtime.sendMessage(
      {
        action: "captureVisibleTab"
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[PokerAnalyzer] Runtime error:", chrome.runtime.lastError);
          this.handleCaptureFailure();
          return;
        }
        
        if (!response || response.error) {
          console.error("[PokerAnalyzer] Screenshot failed:", response?.error || "No response");
          this.handleCaptureFailure();
          return;
        }
        
        if (!response.imageData) {
          console.error("[PokerAnalyzer] No image data in response");
          this.handleCaptureFailure();
          return;
        }
        
        console.log("[PokerAnalyzer] Screenshot received, processing...");
        this.consecutiveFailures = 0;
        
        // Convert dataURL to ImageData and analyze
        this.processScreenshot(response.imageData, startTime);
      }
    );
  }

  handleCaptureFailure() {
    this.consecutiveFailures++;
    if (this.consecutiveFailures > 10) {
      console.error("[PokerAnalyzer] Too many consecutive failures, stopping");
      this.stop();
    }
  }

  processScreenshot(dataURL, startTime) {
    const img = new Image();
    
    img.onload = () => {
      console.log(`[PokerAnalyzer] Image loaded: ${img.width}x${img.height}`);
      
      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Get ImageData
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Analyze the image
      const detection = this.analyzePokerTable(imageData);
      
      if (detection.cards.length > 0 || detection.communityCards.length > 0) {
        console.log("[PokerAnalyzer] Cards detected!", {
          holeCards: detection.cards,
          communityCards: detection.communityCards,
          pot: detection.pot
        });
        
        this.lastDetection = detection;
        
        // Send to background for solver analysis
        chrome.runtime.sendMessage({
          action: "analyze",
          detection: detection,
          site: window.location.hostname,
        });
      }
      
      const elapsed = performance.now() - startTime;
      console.log(`[PokerAnalyzer] Analysis completed in ${elapsed.toFixed(1)}ms`);
    };
    
    img.onerror = (err) => {
      console.error("[PokerAnalyzer] Failed to load screenshot image:", err);
    };
    
    img.src = dataURL;
  }

  analyzePokerTable(imageData) {
    const detection = {
      cards: [],
      communityCards: [],
      pot: null,
      timestamp: Date.now(),
    };

    console.log(`[PokerAnalyzer] Analyzing image ${imageData.width}x${imageData.height}`);

    // Look for poker table region (green felt area)
    const tableRegion = this.findTableRegion(imageData);
    if (tableRegion) {
      console.log(`[PokerAnalyzer] Found table region at ${tableRegion.x},${tableRegion.y} size ${tableRegion.width}x${tableRegion.height}`);
    }

    // Quick card detection using pattern matching
    const cards = this.detectCards(imageData);
    console.log(`[PokerAnalyzer] Detected ${cards.length} potential cards`);

    // Separate hole cards from community cards based on position
    cards.forEach((card) => {
      // Hole cards are typically at the bottom of the screen
      if (card.y > imageData.height * 0.6) {
        detection.cards.push(card);
      } 
      // Community cards are in the middle of the table
      else if (
        card.y > imageData.height * 0.3 &&
        card.y < imageData.height * 0.6
      ) {
        detection.communityCards.push(card);
      }
    });

    // Detect pot size (simplified)
    detection.pot = this.detectPotSize(imageData);

    return detection;
  }

  findTableRegion(imageData) {
    const { data, width, height } = imageData;
    let greenPixelCount = 0;
    let minX = width, maxX = 0;
    let minY = height, maxY = 0;
    
    // Look for green felt color (poker tables are typically green)
    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Check for green-ish colors (g > r and g > b)
        if (g > r + 20 && g > b + 20 && g > 50 && g < 150) {
          greenPixelCount++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // If we found a significant green region, return it
    if (greenPixelCount > 100) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    return null;
  }

  detectCards(imageData) {
    const cards = [];
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Find all white/light rectangular regions (potential cards)
    const cardRegions = this.findCardLikeRegions(data, width, height);

    // Analyze each region to see if it's actually a card
    cardRegions.forEach((region) => {
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
          const region = this.floodFillRegion(
            data,
            width,
            height,
            x,
            y,
            visited,
          );

          if (region && this.isCardShaped(region)) {
            regions.push(region);
          }
        }
      }
    }

    console.log(`[PokerAnalyzer] Found ${regions.length} card-like regions`);
    return regions;
  }

  floodFillRegion(data, width, height, startX, startY, visited) {
    const queue = [{ x: startX, y: startY }];
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    let pixelCount = 0;

    while (queue.length > 0) {
      const { x, y } = queue.shift();
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
        if (x > 0) queue.push({ x: x - 1, y });
        if (x < width - 1) queue.push({ x: x + 1, y });
        if (y > 0) queue.push({ x, y: y - 1 });
        if (y < height - 1) queue.push({ x, y: y + 1 });
      }
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      pixelCount,
    };
  }

  isCardShaped(region) {
    const aspectRatio = region.width / region.height;
    const area = region.width * region.height;
    const fillRatio = region.pixelCount / area;

    // Cards are typically 0.6-0.8 aspect ratio
    // Must be reasonably sized and mostly filled
    return (
      aspectRatio > 0.5 && aspectRatio < 0.9 && area > 1000 && fillRatio > 0.7
    );
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
        suit: suit || "?",
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
      };
    }

    return null;
  }

  extractRegion(imageData, region) {
    const { x, y, width, height } = region;
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
      A: this.matchesA(binary, cornerWidth, cornerHeight),
      K: this.matchesK(binary, cornerWidth, cornerHeight),
      Q: this.matchesQ(binary, cornerWidth, cornerHeight),
      J: this.matchesJ(binary, cornerWidth, cornerHeight),
      T: this.matches10(binary, cornerWidth, cornerHeight),
      // For number cards, count vertical lines
      2: this.countVerticalLines(binary, cornerWidth, cornerHeight) === 2,
      3: this.countVerticalLines(binary, cornerWidth, cornerHeight) === 3,
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
        const gray =
          (imageData.data[idx] +
            imageData.data[idx + 1] +
            imageData.data[idx + 2]) /
          3;
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
      return redPixels > suitWidth * suitHeight * 0.1 ? "h" : "d";
    } else {
      return blackPixels > suitWidth * suitHeight * 0.1 ? "s" : "c";
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
if (
  window.location.hostname.includes("poker") ||
  window.location.hostname.includes("globalpoker") ||
  window.location.hostname.includes("pokerstars")
) {
  setTimeout(() => {
    console.log("[PokerAnalyzer] Auto-starting on poker site...");
    
    // Log page structure for debugging
    console.log("[PokerAnalyzer] Page structure:");
    console.log("- Body dimensions:", document.body.offsetWidth, "x", document.body.offsetHeight);
    console.log("- Canvas elements:", document.querySelectorAll('canvas').length);
    console.log("- iFrames:", document.querySelectorAll('iframe').length);
    
    analyzer.start();
  }, 2000);
}