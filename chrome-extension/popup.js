/**
 * Popup script for Chrome extension interface
 */

let isRunning = false;
let currentTab = null;

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

  // Get current state
  chrome.runtime.sendMessage({ action: "getState" }, (state) => {
    if (state && state.isRunning && state.currentTab === tab.id) {
      setRunningState(true);
      updateStats(state);
    }
  });

  // Set current site
  currentSite.textContent = new URL(tab.url).hostname;

  // Setup event listeners
  startBtn.addEventListener("click", startAnalysis);
  stopBtn.addEventListener("click", stopAnalysis);
  intervalSlider.addEventListener("input", updateInterval);

  // Listen for detection updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "detectionUpdate") {
      updateLastDetection(message.detection);
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
  // First, inject content script if needed
  try {
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ["content.js"],
    });
  } catch (e) {
    console.log("Content script already injected");
  }

  // Send start message
  chrome.tabs.sendMessage(
    currentTab.id,
    {
      action: "start",
      interval: parseInt(intervalSlider.value),
    },
    (response) => {
      if (response && response.status === "started") {
        setRunningState(true);
      }
    },
  );
}

function stopAnalysis() {
  chrome.tabs.sendMessage(currentTab.id, { action: "stop" }, (response) => {
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
  if (state.detections) {
    handsCount.textContent = state.detections.length;

    // Calculate detection rate
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
  if (!detection || detection.cards.length === 0) return;

  lastDetection.style.display = "block";
  detectedCards.innerHTML = "";

  // Display hole cards
  detection.cards.forEach((card) => {
    const cardEl = createCardElement(card);
    detectedCards.appendChild(cardEl);
  });

  // Update stats
  chrome.runtime.sendMessage({ action: "getState" }, (state) => {
    updateStats(state);
  });
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
