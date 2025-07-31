/**
 * Content script that runs on poker sites
 */

import { PokerDetector } from "../lib/detector";
import { PokerSolver } from "../lib/solver";

class PokerAnalyzer {
  private detector: PokerDetector;
  private solver: PokerSolver;
  private isRunning: boolean = false;
  private intervalId: number | null = null;
  private overlayElement: HTMLDivElement | null = null;

  constructor() {
    this.detector = new PokerDetector();
    this.solver = new PokerSolver();
    this.setupMessageListener();
  }

  /**
   * Start analyzing the page
   */
  start(intervalMs: number = 250) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.createOverlay();

    this.intervalId = window.setInterval(() => {
      this.captureAndAnalyze();
    }, intervalMs);

    // Initial capture
    this.captureAndAnalyze();
  }

  /**
   * Stop analyzing
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.removeOverlay();
  }

  /**
   * Capture current viewport and analyze
   */
  private async captureAndAnalyze() {
    try {
      const imageData = await this.captureViewport();
      const tableState = await this.detector.detectTable(imageData);

      if (tableState.holeCards.length > 0) {
        const analysis = this.solver.analyze(
          tableState.holeCards.map((c) => c.rank + c.suit),
          tableState.communityCards.map((c) => c.rank + c.suit),
          parseInt(tableState.potSize) || 0,
          tableState.playerCount,
        );

        this.updateOverlay(tableState, analysis);

        // Send to background script
        chrome.runtime.sendMessage({
          type: "TABLE_UPDATE",
          data: { tableState, analysis },
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
    }
  }

  /**
   * Capture current viewport
   */
  private async captureViewport(): Promise<ImageData> {
    // Create canvas matching viewport size
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Use html2canvas or similar approach
    // For now, we'll capture the body element
    return new Promise((resolve) => {
      // Simplified capture - in production use html2canvas
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };

      // Trigger capture via background script
      chrome.runtime.sendMessage({ type: "CAPTURE_TAB" }, (dataUrl: string) => {
        img.src = dataUrl;
      });
    });
  }

  /**
   * Create overlay for displaying analysis
   */
  private createOverlay() {
    this.overlayElement = document.createElement("div");
    this.overlayElement.id = "poker-analyzer-overlay";
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 999999;
      min-width: 250px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(this.overlayElement);
  }

  /**
   * Update overlay with analysis results
   */
  private updateOverlay(tableState: any, analysis: any) {
    if (!this.overlayElement) return;

    const actionColors: Record<string, string> = {
      fold: "#ff4444",
      check: "#ffaa00",
      call: "#ffaa00",
      raise: "#44ff44",
    };

    this.overlayElement.innerHTML = `
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
        Poker Analyzer
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Hand:</strong> ${tableState.holeCards.map((c: any) => c.rank + c.suit).join(" ")}
      </div>
      ${
        analysis.currentHand
          ? `
        <div style="margin-bottom: 8px;">
          <strong>Current:</strong> ${analysis.currentHand.name}
        </div>
      `
          : ""
      }
      <div style="margin-bottom: 8px;">
        <strong>Win Prob:</strong> ${(analysis.winProbability * 100).toFixed(1)}%
      </div>
      <div style="
        background: ${actionColors[analysis.recommendedAction]};
        color: white;
        padding: 8px;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
        margin-top: 10px;
      ">
        ${analysis.recommendedAction.toUpperCase()}
        ${analysis.raiseAmount ? ` $${analysis.raiseAmount}` : ""}
      </div>
    `;
  }

  /**
   * Remove overlay
   */
  private removeOverlay() {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
  }

  /**
   * Setup message listener
   */
  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case "START_ANALYSIS":
          this.start(request.interval);
          sendResponse({ success: true });
          break;
        case "STOP_ANALYSIS":
          this.stop();
          sendResponse({ success: true });
          break;
        case "GET_STATUS":
          sendResponse({ isRunning: this.isRunning });
          break;
      }
      return true;
    });
  }
}

// Initialize analyzer
const analyzer = new PokerAnalyzer();
