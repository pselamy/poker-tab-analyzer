/**
 * Background service worker for Chrome extension
 */

interface TableUpdate {
  tableState: any;
  analysis: any;
  timestamp: number;
  tabId: number;
}

class BackgroundService {
  private history: Map<number, TableUpdate[]> = new Map();

  constructor() {
    this.setupMessageListeners();
    this.setupTabListeners();
  }

  /**
   * Setup message listeners
   */
  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case "CAPTURE_TAB":
          this.captureTab(sender.tab?.id).then(sendResponse);
          return true; // Will respond asynchronously

        case "TABLE_UPDATE":
          if (sender.tab?.id) {
            this.addToHistory(sender.tab.id, request.data);
          }
          break;

        case "GET_HISTORY":
          sendResponse(this.getHistory(request.tabId));
          break;

        case "CLEAR_HISTORY":
          this.clearHistory(request.tabId);
          sendResponse({ success: true });
          break;
      }
    });
  }

  /**
   * Setup tab listeners
   */
  private setupTabListeners() {
    // Clean up history when tab is closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.history.delete(tabId);
    });

    // Clean up old history periodically
    setInterval(() => {
      const cutoff = Date.now() - 3600000; // 1 hour
      for (const [tabId, updates] of this.history.entries()) {
        const filtered = updates.filter((u) => u.timestamp > cutoff);
        if (filtered.length === 0) {
          this.history.delete(tabId);
        } else {
          this.history.set(tabId, filtered);
        }
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Capture tab screenshot
   */
  private async captureTab(tabId?: number): Promise<string> {
    if (!tabId) throw new Error("No tab ID");

    try {
      const dataUrl = await chrome.tabs.captureVisibleTab({ format: "png" });
      return dataUrl;
    } catch (error) {
      console.error("Failed to capture tab:", error);
      throw error;
    }
  }

  /**
   * Add update to history
   */
  private addToHistory(tabId: number, data: any) {
    const update: TableUpdate = {
      ...data,
      timestamp: Date.now(),
      tabId,
    };

    const tabHistory = this.history.get(tabId) || [];
    tabHistory.push(update);

    // Keep only last 1000 updates per tab
    if (tabHistory.length > 1000) {
      tabHistory.shift();
    }

    this.history.set(tabId, tabHistory);
  }

  /**
   * Get history for tab
   */
  private getHistory(tabId: number): TableUpdate[] {
    return this.history.get(tabId) || [];
  }

  /**
   * Clear history for tab
   */
  private clearHistory(tabId: number) {
    this.history.delete(tabId);
  }
}

// Initialize background service
const service = new BackgroundService();
