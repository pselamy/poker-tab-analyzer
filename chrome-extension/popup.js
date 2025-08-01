/**
 * Popup script for Chrome extension interface
 */

let isRunning = false;
let currentTab = null;
let sessionData = {
  handsAnalyzed: 0,
  sessionStartTime: null,
};

// DOM elements
const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const stats = document.getElementById("stats");
const handsCount = document.getElementById("handsCount");
const currentSite = document.getElementById("currentSite");
const detectionRate = document.getElementById("detectionRate");
const lastDetection = document.getElementById("lastDetection");
const detectedCards = document.getElementById("detectedCards");
const intervalSlider = document.getElementById("intervalSlider");
const intervalValue = document.getElementById("intervalValue");

// Initialize
document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Check if it's a poker site
  if (!isPokerSite(tab.url)) {
    statusText.textContent = "Not on a poker site";
    startBtn.disabled = true;
    return;
  }

  // Get current state from background
  chrome.runtime.sendMessage({ action: "getState" }, (state) => {
    console.log("[Popup] Received state:", state);
    if (state) {
      // Update session data
      sessionData.handsAnalyzed = state.handsAnalyzed || 0;
      sessionData.sessionStartTime = state.sessionStartTime;

      // Check if analyzer is running for this tab
      if (state.isRunning && state.currentTab === tab.id) {
        setRunningState(true);
        updateStats(state);
      }

      // Show hands count even if not currently running
      if (state.handsAnalyzed > 0) {
        handsCount.textContent = state.handsAnalyzed;
        document.getElementById("stats").style.display = "block";
      }
    }
  });

  // Set current site
  currentSite.textContent = new URL(tab.url).hostname;

  // Setup event listeners
  startBtn.addEventListener("click", startAnalysis);
  stopBtn.addEventListener("click", stopAnalysis);
  intervalSlider.addEventListener("input", updateInterval);

  // Listen for detection updates from background
  chrome.runtime.onMessage.addListener((message) => {
    console.log("[Popup] Received runtime message:", message.action);

    if (message.action === "detectionUpdate") {
      // Update stats with new state
      if (message.state) {
        sessionData.handsAnalyzed = message.state.handsAnalyzed || 0;
        updateStats(message.state);
      }

      // Update last detection display
      if (message.detection) {
        updateLastDetection(message.detection);
      }
    }
  });
}

function isPokerSite(url) {
  if (!url) return false;

  const pokerDomains = [
    "poker",
    "globalpoker",
    "pokerstars",
    "ggpoker",
    "partypoker",
    "wsop",
    "888poker",
    "americascardroom",
  ];

  return pokerDomains.some((domain) => url.includes(domain));
}

async function startAnalysis() {
  console.log("[Popup] Starting analysis...");

  // First, inject content script if needed
  try {
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ["content.js"],
    });
    console.log("[Popup] Content script injected");
  } catch (e) {
    console.log("[Popup] Content script already injected");
  }

  // Send start message through background
  chrome.runtime.sendMessage(
    {
      action: "startAnalyzer",
      tab: currentTab,
    },
    (response) => {
      console.log("[Popup] Start response:", response);
    },
  );

  // Also send start message directly to content script
  chrome.tabs.sendMessage(
    currentTab.id,
    {
      action: "start",
      interval: parseInt(intervalSlider.value),
    },
    (response) => {
      console.log("[Popup] Content script start response:", response);
      if (response && response.status === "started") {
        setRunningState(true);
      }
    },
  );
}

function stopAnalysis() {
  console.log("[Popup] Stopping analysis...");

  // Send stop message through background
  chrome.runtime.sendMessage({
    action: "stopAnalyzer",
  });

  // Also send stop message directly to content script
  chrome.tabs.sendMessage(currentTab.id, { action: "stop" }, (response) => {
    console.log("[Popup] Content script stop response:", response);
    if (response && response.status === "stopped") {
      setRunningState(false);
    }
  });
}

function setRunningState(running) {
  isRunning = running;

  if (running) {
    statusIndicator.classList.add("active");
    statusText.textContent = "Analyzing...";
    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
    stats.style.display = "block";
  } else {
    statusIndicator.classList.remove("active");
    statusText.textContent = "Not running";
    startBtn.style.display = "inline-block";
    stopBtn.style.display = "none";
  }
}

function updateStats(state) {
  console.log("[Popup] Updating stats:", state);

  // Update hands analyzed count
  if (state.handsAnalyzed !== undefined) {
    handsCount.textContent = state.handsAnalyzed;
  }

  // Calculate session duration
  if (state.sessionStartTime) {
    const duration = Date.now() - state.sessionStartTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    // Update or create session duration display
    let sessionDuration = document.getElementById("sessionDuration");
    if (!sessionDuration) {
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML =
        '<span>Session Time:</span><span id="sessionDuration">-</span>';
      document.getElementById("stats").appendChild(row);
      sessionDuration = document.getElementById("sessionDuration");
    }
    sessionDuration.textContent = `${minutes}m ${seconds}s`;
  }

  // Calculate detection rate from recent detections
  if (state.detections) {
    const recentDetections = state.detections.slice(-20);
    const detectedCount = recentDetections.filter(
      (d) => d.cards.length > 0,
    ).length;
    const rate =
      recentDetections.length > 0
        ? Math.round((detectedCount / recentDetections.length) * 100)
        : 0;
    detectionRate.textContent = `${rate}%`;
  }
}

function updateLastDetection(detection) {
  console.log("[Popup] Updating last detection:", detection);

  if (!detection) return;

  // Show last detection section even if no cards yet
  lastDetection.style.display = "block";

  if (detection.cards.length === 0 && detection.communityCards.length === 0) {
    detectedCards.innerHTML =
      '<div style="color: #888; font-size: 12px;">Waiting for cards...</div>';
    return;
  }

  detectedCards.innerHTML = "";

  // Display hole cards
  if (detection.cards.length > 0) {
    const holeCardsDiv = document.createElement("div");
    holeCardsDiv.innerHTML =
      '<div style="font-size: 12px; margin-bottom: 5px;">Hole Cards:</div>';
    detection.cards.forEach((card) => {
      const cardEl = createCardElement(card);
      holeCardsDiv.appendChild(cardEl);
    });
    detectedCards.appendChild(holeCardsDiv);
  }

  // Display community cards if any
  if (detection.communityCards && detection.communityCards.length > 0) {
    const communityDiv = document.createElement("div");
    communityDiv.innerHTML =
      '<div style="font-size: 12px; margin: 10px 0 5px 0;">Community:</div>';
    detection.communityCards.forEach((card) => {
      const cardEl = createCardElement(card);
      communityDiv.appendChild(cardEl);
    });
    detectedCards.appendChild(communityDiv);
  }
}

function createCardElement(card) {
  const div = document.createElement("div");
  div.className = "card";

  if (card.suit === "h" || card.suit === "d") {
    div.classList.add("red");
  }

  const suitSymbols = {
    s: "♠",
    h: "♥",
    d: "♦",
    c: "♣",
    "?": "?",
  };

  div.textContent = card.rank + (suitSymbols[card.suit] || "");
  return div;
}

function updateInterval() {
  intervalValue.textContent = intervalSlider.value;

  // Update running analyzer if active
  if (isRunning) {
    chrome.tabs.sendMessage(currentTab.id, {
      action: "updateInterval",
      interval: parseInt(intervalSlider.value),
    });
  }
}
