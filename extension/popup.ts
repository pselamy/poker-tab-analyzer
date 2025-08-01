/**
 * Popup script for extension UI
 */

class PopupController {
  private toggleBtn: HTMLButtonElement;
  private intervalInput: HTMLInputElement;
  private statusElement: HTMLElement;
  private handCountElement: HTMLElement;
  private sessionTimeElement: HTMLElement;
  private currentHandElement: HTMLElement;

  private isRunning: boolean = false;
  private startTime: number = 0;
  private handCount: number = 0;
  private sessionInterval: number | null = null;

  constructor() {
    this.toggleBtn = document.getElementById("toggle-btn") as HTMLButtonElement;
    this.intervalInput = document.getElementById(
      "interval",
    ) as HTMLInputElement;
    this.statusElement = document.getElementById("status")!;
    this.handCountElement = document.getElementById("hand-count")!;
    this.sessionTimeElement = document.getElementById("session-time")!;
    this.currentHandElement = document.getElementById("current-hand")!;

    this.init();
  }

  private async init() {
    // Get current status from storage AND content script
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    
    // First check storage for persistent state
    const result = await chrome.storage.local.get(['isAnalyzing', 'startTime', 'handCount']);
    if (result.isAnalyzing) {
      this.startTime = result.startTime || Date.now();
      this.handCount = result.handCount || 0;
      this.handCountElement.textContent = this.handCount.toString();
      this.setRunning(true);
    }
    
    // Also check with content script to ensure it's actually running
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "GET_STATUS" }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not injected yet
          console.log('Content script not ready');
          return;
        }
        if (response?.isRunning !== this.isRunning) {
          this.setRunning(response?.isRunning || false);
        }
      });
    }

    // Setup event listeners
    this.toggleBtn.addEventListener("click", () => this.toggleAnalysis());

    document.getElementById("history-btn")?.addEventListener("click", () => {
      // TODO: Open history view
    });

    document.getElementById("settings-btn")?.addEventListener("click", () => {
      // TODO: Open settings
    });

    // Listen for updates
    chrome.runtime.onMessage.addListener((request) => {
      if (request.type === "TABLE_UPDATE") {
        this.updateCurrentHand(request.data);
      }
    });
  }

  private async toggleAnalysis() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab.id) return;

    if (this.isRunning) {
      // Stop analysis
      chrome.tabs.sendMessage(tab.id, { type: "STOP_ANALYSIS" });
      this.setRunning(false);
      // Clear storage
      chrome.storage.local.remove(['isAnalyzing', 'startTime', 'handCount']);
    } else {
      // Start analysis
      const interval = parseInt(this.intervalInput.value);
      chrome.tabs.sendMessage(tab.id, {
        type: "START_ANALYSIS",
        interval: interval,
      });
      this.setRunning(true);
      // Save to storage
      chrome.storage.local.set({
        isAnalyzing: true,
        startTime: Date.now(),
        handCount: 0,
        interval: interval
      });
    }
  }

  private setRunning(running: boolean) {
    this.isRunning = running;

    if (running) {
      this.toggleBtn.textContent = "Stop Analysis";
      this.toggleBtn.classList.add("active");
      this.statusElement.classList.add("active");
      this.statusElement.querySelector(".status-text")!.textContent = "Active";

      this.startTime = Date.now();
      this.startSessionTimer();
    } else {
      this.toggleBtn.textContent = "Start Analysis";
      this.toggleBtn.classList.remove("active");
      this.statusElement.classList.remove("active");
      this.statusElement.querySelector(".status-text")!.textContent =
        "Inactive";

      this.stopSessionTimer();
      this.currentHandElement.style.display = "none";
    }
  }

  private startSessionTimer() {
    this.sessionInterval = window.setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      this.sessionTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }, 1000);
  }

  private stopSessionTimer() {
    if (this.sessionInterval !== null) {
      clearInterval(this.sessionInterval);
      this.sessionInterval = null;
    }
    this.sessionTimeElement.textContent = "0:00";
    this.handCount = 0;
    this.handCountElement.textContent = "0";
  }

  private updateCurrentHand(data: any) {
    const { tableState, analysis } = data;

    if (tableState.holeCards.length > 0) {
      this.handCount++;
      this.handCountElement.textContent = this.handCount.toString();
      
      // Update storage with new hand count
      chrome.storage.local.set({ handCount: this.handCount });

      this.currentHandElement.style.display = "block";

      // Update hole cards
      const holeCardsEl = document.getElementById("hole-cards")!;
      holeCardsEl.textContent = tableState.holeCards
        .map((c: any) => this.cardToEmoji(c.rank, c.suit))
        .join(" ");

      // Update hand strength
      const handStrengthEl = document.getElementById("hand-strength")!;
      if (analysis.currentHand) {
        handStrengthEl.textContent = analysis.currentHand.name;
      }

      // Update recommendation
      const recommendationEl = document.getElementById("recommendation")!;
      recommendationEl.className = `recommendation ${analysis.recommendedAction}`;
      recommendationEl.textContent = analysis.recommendedAction.toUpperCase();
      if (analysis.raiseAmount) {
        recommendationEl.textContent += ` $${analysis.raiseAmount}`;
      }
    }
  }

  private cardToEmoji(rank: string, suit: string): string {
    const suitEmojis: Record<string, string> = {
      "♠": "♠️",
      "♥": "♥️",
      "♦": "♦️",
      "♣": "♣️",
    };
    return rank + (suitEmojis[suit] || suit);
  }
}

// Initialize popup controller
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
