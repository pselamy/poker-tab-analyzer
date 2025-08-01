/**
 * Background service worker for Chrome extension
 * Handles communication between content script and native solver
 */

// Extension state - persisted across popup open/close
let analyzerState = {
  isRunning: false,
  currentTab: null,
  detections: [],
  handsAnalyzed: 0,
  sessionStartTime: null,
};

// Load persisted state
chrome.storage.local.get(['analyzerState'], (result) => {
  if (result.analyzerState) {
    analyzerState = { ...analyzerState, ...result.analyzerState };
    console.log('[Background] Loaded persisted state:', analyzerState);
  }
});

// Native messaging port (optional, for Python solver)
let nativePort = null;

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes("http")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Received message:', request.action);
  
  switch (request.action) {
    case "analyze":
      handleDetection(request.detection, sender.tab);
      sendResponse({ success: true });
      break;

    case "captureVisibleTab":
      // Capture the visible tab and send back as data URL
      chrome.tabs.captureVisibleTab(sender.tab.windowId, {
        format: "png"
      }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Screenshot failed:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log('[Background] Screenshot captured successfully');
          sendResponse({ imageData: dataUrl });
        }
      });
      return true; // Will respond asynchronously

    case "getState":
      sendResponse(analyzerState);
      break;

    case "startAnalyzer":
      startAnalyzer(sender.tab);
      sendResponse({ success: true });
      break;

    case "stopAnalyzer":
      stopAnalyzer();
      sendResponse({ success: true });
      break;
  }
});

// Removed - handled inline above

function handleDetection(detection, tab) {
  console.log('[Background] Handling detection:', detection);
  
  // Update state
  analyzerState.currentTab = tab.id;
  analyzerState.detections.push({
    ...detection,
    tabId: tab.id,
    url: tab.url,
  });

  // Increment hands analyzed if we detected cards
  if (detection.cards.length > 0 || detection.communityCards.length > 0) {
    analyzerState.handsAnalyzed++;
  }

  // Keep only recent detections
  if (analyzerState.detections.length > 100) {
    analyzerState.detections = analyzerState.detections.slice(-50);
  }

  // Save state
  chrome.storage.local.set({ analyzerState });

  // Send update to popup if it's open
  chrome.runtime.sendMessage({
    action: "detectionUpdate",
    detection: detection,
    state: analyzerState
  }).catch(() => {
    // Popup not open, ignore error
  });

  // Analyze hand with solver
  if (detection.cards.length >= 2) {
    analyzeHand(detection);
  }
}

function analyzeHand(detection) {
  // Simple hand analysis (replace with actual solver)
  const recommendation = getBasicRecommendation(detection);

  // Send recommendation back to content script
  chrome.tabs.sendMessage(analyzerState.currentTab, {
    action: "showRecommendation",
    recommendation: recommendation,
  });
}

function getBasicRecommendation(detection) {
  const { cards, communityCards, pot } = detection;

  // Very basic strategy (replace with real solver)
  if (cards.length === 2) {
    const hasAce = cards.some((c) => c.rank === "A");
    const hasPair = cards[0].rank === cards[1].rank;

    if (hasPair || hasAce) {
      return {
        action: "raise",
        confidence: 0.7,
        reasoning: hasPair ? "Pocket pair" : "Ace high",
      };
    }
  }

  return {
    action: "check",
    confidence: 0.5,
    reasoning: "Default play",
  };
}

function startAnalyzer(tab) {
  analyzerState.isRunning = true;
  analyzerState.currentTab = tab.id;
  
  // Reset session if starting fresh
  if (!analyzerState.sessionStartTime) {
    analyzerState.sessionStartTime = Date.now();
    analyzerState.handsAnalyzed = 0;
  }

  // Save state
  chrome.storage.local.set({ analyzerState });

  // Send start message to content script
  chrome.tabs.sendMessage(tab.id, { action: "start" });
  
  console.log('[Background] Started analyzer for tab:', tab.id);
}

function stopAnalyzer() {
  analyzerState.isRunning = false;
  analyzerState.sessionStartTime = null;

  // Save state
  chrome.storage.local.set({ analyzerState });

  if (analyzerState.currentTab) {
    chrome.tabs.sendMessage(analyzerState.currentTab, { action: "stop" });
  }
  
  console.log('[Background] Stopped analyzer');
}

// Optional: Connect to native solver
function connectToNativeSolver() {
  try {
    nativePort = chrome.runtime.connectNative("com.pokeranalyzer.solver");

    nativePort.onMessage.addListener((message) => {
      console.log("Native solver:", message);
    });

    nativePort.onDisconnect.addListener(() => {
      console.log("Native solver disconnected");
      nativePort = null;
    });
  } catch (error) {
    console.error("Failed to connect to native solver:", error);
  }
}
