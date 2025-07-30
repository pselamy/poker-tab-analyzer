/**
 * Background service worker for Chrome extension
 * Handles communication between content script and native solver
 */

// Extension state
let analyzerState = {
  isRunning: false,
  currentTab: null,
  detections: []
};

// Native messaging port (optional, for Python solver)
let nativePort = null;

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('http')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'analyze':
      handleDetection(request.detection, sender.tab);
      sendResponse({ success: true });
      break;
      
    case 'captureVisibleTab':
      captureTabArea(sender.tab, request.rect).then(imageData => {
        sendResponse({ imageData });
      });
      return true; // Will respond asynchronously
      
    case 'getState':
      sendResponse(analyzerState);
      break;
      
    case 'startAnalyzer':
      startAnalyzer(sender.tab);
      sendResponse({ success: true });
      break;
      
    case 'stopAnalyzer':
      stopAnalyzer();
      sendResponse({ success: true });
      break;
  }
});

async function captureTabArea(tab, rect) {
  try {
    // Capture visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });
    
    // TODO: Crop to specific rect if needed
    // For now, return full capture
    return dataUrl;
  } catch (error) {
    console.error('Failed to capture tab:', error);
    return null;
  }
}

function handleDetection(detection, tab) {
  // Update state
  analyzerState.currentTab = tab.id;
  analyzerState.detections.push({
    ...detection,
    tabId: tab.id,
    url: tab.url
  });
  
  // Keep only recent detections
  if (analyzerState.detections.length > 100) {
    analyzerState.detections = analyzerState.detections.slice(-50);
  }
  
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
    action: 'showRecommendation',
    recommendation: recommendation
  });
}

function getBasicRecommendation(detection) {
  const { cards, communityCards, pot } = detection;
  
  // Very basic strategy (replace with real solver)
  if (cards.length === 2) {
    const hasAce = cards.some(c => c.rank === 'A');
    const hasPair = cards[0].rank === cards[1].rank;
    
    if (hasPair || hasAce) {
      return {
        action: 'raise',
        confidence: 0.7,
        reasoning: hasPair ? 'Pocket pair' : 'Ace high'
      };
    }
  }
  
  return {
    action: 'check',
    confidence: 0.5,
    reasoning: 'Default play'
  };
}

function startAnalyzer(tab) {
  analyzerState.isRunning = true;
  analyzerState.currentTab = tab.id;
  
  // Send start message to content script
  chrome.tabs.sendMessage(tab.id, { action: 'start' });
}

function stopAnalyzer() {
  analyzerState.isRunning = false;
  
  if (analyzerState.currentTab) {
    chrome.tabs.sendMessage(analyzerState.currentTab, { action: 'stop' });
  }
}

// Optional: Connect to native solver
function connectToNativeSolver() {
  try {
    nativePort = chrome.runtime.connectNative('com.pokeranalyzer.solver');
    
    nativePort.onMessage.addListener((message) => {
      console.log('Native solver:', message);
    });
    
    nativePort.onDisconnect.addListener(() => {
      console.log('Native solver disconnected');
      nativePort = null;
    });
  } catch (error) {
    console.error('Failed to connect to native solver:', error);
  }
}
