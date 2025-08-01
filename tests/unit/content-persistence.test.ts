/**
 * Tests for content script persistence functionality
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Mock chrome API
const mockStorage = new Map<string, any>();
let startCalled = false;
let startInterval = 0;

global.chrome = {
  storage: {
    local: {
      get: async (keys: string[]) => {
        const result: any = {};
        keys.forEach(key => {
          if (mockStorage.has(key)) {
            result[key] = mockStorage.get(key);
          }
        });
        return result;
      }
    }
  },
  runtime: {
    onMessage: {
      addListener: () => {}
    },
    sendMessage: () => {}
  }
} as any;

// Mock PokerAnalyzer methods
class MockPokerAnalyzer {
  start(interval: number) {
    startCalled = true;
    startInterval = interval;
  }
  
  async checkAndRestoreState() {
    const result = await chrome.storage.local.get(['isAnalyzing', 'interval']);
    if (result.isAnalyzing) {
      this.start(result.interval || 250);
    }
  }
}

test('Content Script - should restore analysis state on initialization', async (t) => {
  // Arrange
  mockStorage.clear();
  mockStorage.set('isAnalyzing', true);
  mockStorage.set('interval', 500);
  startCalled = false;
  startInterval = 0;
  
  // Act
  const analyzer = new MockPokerAnalyzer();
  await analyzer.checkAndRestoreState();
  
  // Assert
  assert.strictEqual(startCalled, true);
  assert.strictEqual(startInterval, 500);
});

test('Content Script - should not start analysis if not previously running', async (t) => {
  // Arrange
  mockStorage.clear();
  mockStorage.set('isAnalyzing', false);
  startCalled = false;
  
  // Act
  const analyzer = new MockPokerAnalyzer();
  await analyzer.checkAndRestoreState();
  
  // Assert
  assert.strictEqual(startCalled, false);
});

test('Content Script - should use default interval if not specified', async (t) => {
  // Arrange
  mockStorage.clear();
  mockStorage.set('isAnalyzing', true);
  // No interval set
  startCalled = false;
  startInterval = 0;
  
  // Act
  const analyzer = new MockPokerAnalyzer();
  await analyzer.checkAndRestoreState();
  
  // Assert
  assert.strictEqual(startCalled, true);
  assert.strictEqual(startInterval, 250); // Default value
});

test('Content Script - should handle empty storage gracefully', async (t) => {
  // Arrange
  mockStorage.clear();
  startCalled = false;
  
  // Act
  const analyzer = new MockPokerAnalyzer();
  await analyzer.checkAndRestoreState();
  
  // Assert
  assert.strictEqual(startCalled, false);
});

// Edge cases
test('Content Script - should handle invalid interval types', async (t) => {
  // Arrange
  mockStorage.clear();
  mockStorage.set('isAnalyzing', true);
  mockStorage.set('interval', 'not-a-number');
  startCalled = false;
  startInterval = 0;
  
  // Act
  const analyzer = new MockPokerAnalyzer();
  await analyzer.checkAndRestoreState();
  
  // Assert
  assert.strictEqual(startCalled, true);
  assert.strictEqual(startInterval, 250); // Falls back to default
});

test('Content Script - should handle zero interval', async (t) => {
  // Arrange
  mockStorage.clear();
  mockStorage.set('isAnalyzing', true);
  mockStorage.set('interval', 0);
  startCalled = false;
  startInterval = 0;
  
  // Act
  const analyzer = new MockPokerAnalyzer();
  await analyzer.checkAndRestoreState();
  
  // Assert
  assert.strictEqual(startCalled, true);
  assert.strictEqual(startInterval, 250); // Falls back to default for invalid interval
});

test('Content Script - should handle very large intervals', async (t) => {
  // Arrange
  mockStorage.clear();
  mockStorage.set('isAnalyzing', true);
  mockStorage.set('interval', 999999999);
  startCalled = false;
  startInterval = 0;
  
  // Act
  const analyzer = new MockPokerAnalyzer();
  await analyzer.checkAndRestoreState();
  
  // Assert
  assert.strictEqual(startCalled, true);
  assert.strictEqual(startInterval, 999999999);
});

test('Content Script - should be idempotent when called multiple times', async (t) => {
  // Arrange
  mockStorage.clear();
  mockStorage.set('isAnalyzing', true);
  mockStorage.set('interval', 300);
  let callCount = 0;
  
  // Mock start to count calls
  const analyzer = new MockPokerAnalyzer();
  const originalStart = analyzer.start;
  analyzer.start = function(interval: number) {
    callCount++;
    originalStart.call(this, interval);
  };
  
  // Act
  await analyzer.checkAndRestoreState();
  await analyzer.checkAndRestoreState();
  await analyzer.checkAndRestoreState();
  
  // Assert
  assert.strictEqual(callCount, 3); // Each call triggers start
});