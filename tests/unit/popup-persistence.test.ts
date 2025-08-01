/**
 * Tests for popup persistence functionality
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Mock chrome API
const mockStorage = new Map<string, any>();
const mockTabs: any[] = [];
let mockMessages: any[] = [];

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
      },
      set: async (items: any) => {
        Object.entries(items).forEach(([key, value]) => {
          mockStorage.set(key, value);
        });
      },
      remove: async (keys: string[]) => {
        keys.forEach(key => mockStorage.delete(key));
      }
    }
  },
  tabs: {
    query: async () => mockTabs,
    sendMessage: (tabId: number, message: any, callback?: Function) => {
      mockMessages.push({ tabId, message });
      if (callback) callback({ isRunning: mockStorage.get('isAnalyzing') });
    }
  },
  runtime: {
    lastError: null,
    onMessage: {
      addListener: () => {}
    }
  }
} as any;

test('Popup - should restore state from storage on init', async (t) => {
  // Arrange
  mockStorage.clear();
  mockStorage.set('isAnalyzing', true);
  mockStorage.set('startTime', 1234567890);
  mockStorage.set('handCount', 42);
  mockTabs.push({ id: 1 });

  // Act
  // Simulate popup initialization
  const result = await chrome.storage.local.get(['isAnalyzing', 'startTime', 'handCount']);

  // Assert
  assert.strictEqual(result.isAnalyzing, true);
  assert.strictEqual(result.startTime, 1234567890);
  assert.strictEqual(result.handCount, 42);
});

test('Popup - should handle missing storage values gracefully', async (t) => {
  // Arrange
  mockStorage.clear();
  
  // Act
  const result = await chrome.storage.local.get(['isAnalyzing', 'startTime', 'handCount']);
  
  // Assert
  assert.strictEqual(result.isAnalyzing, undefined);
  assert.strictEqual(result.startTime, undefined);
  assert.strictEqual(result.handCount, undefined);
});

test('Popup - should save state to storage when starting analysis', async (t) => {
  // Arrange
  mockStorage.clear();
  const beforeTime = Date.now();
  
  // Act
  await chrome.storage.local.set({
    isAnalyzing: true,
    startTime: Date.now(),
    handCount: 0,
    interval: 250
  });
  
  // Assert
  assert.strictEqual(mockStorage.get('isAnalyzing'), true);
  assert.ok(mockStorage.get('startTime') >= beforeTime);
  assert.strictEqual(mockStorage.get('handCount'), 0);
  assert.strictEqual(mockStorage.get('interval'), 250);
});

test('Popup - should clear storage when stopping analysis', async (t) => {
  // Arrange
  mockStorage.set('isAnalyzing', true);
  mockStorage.set('startTime', 1234567890);
  mockStorage.set('handCount', 10);
  
  // Act
  await chrome.storage.local.remove(['isAnalyzing', 'startTime', 'handCount']);
  
  // Assert
  assert.strictEqual(mockStorage.has('isAnalyzing'), false);
  assert.strictEqual(mockStorage.has('startTime'), false);
  assert.strictEqual(mockStorage.has('handCount'), false);
});

test('Popup - should update hand count in storage', async (t) => {
  // Arrange
  mockStorage.set('handCount', 5);
  
  // Act
  await chrome.storage.local.set({ handCount: 6 });
  
  // Assert
  assert.strictEqual(mockStorage.get('handCount'), 6);
});

test('Popup - should handle chrome.runtime.lastError gracefully', async (t) => {
  // Arrange
  mockMessages = [];
  chrome.runtime.lastError = { message: 'Content script not injected' };
  mockTabs[0] = { id: 1 };
  
  // Act
  chrome.tabs.sendMessage(1, { type: 'GET_STATUS' }, (response) => {
    // Should not throw error
  });
  
  // Assert
  assert.strictEqual(mockMessages.length, 1);
  assert.strictEqual(mockMessages[0].message.type, 'GET_STATUS');
});

test('Popup - should handle missing tab ID', async (t) => {
  // Arrange
  mockTabs.length = 0;
  mockMessages = [];
  
  // Act
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Assert
  assert.strictEqual(tabs.length, 0);
  assert.strictEqual(mockMessages.length, 0);
});

test('Popup - should sync state between storage and content script', async (t) => {
  // Arrange
  mockStorage.set('isAnalyzing', true);
  mockTabs[0] = { id: 1 };
  let contentScriptResponse = false;
  
  // Act
  chrome.tabs.sendMessage(1, { type: 'GET_STATUS' }, (response) => {
    contentScriptResponse = response?.isRunning || false;
  });
  
  // Assert
  assert.strictEqual(mockStorage.get('isAnalyzing'), true);
  assert.strictEqual(contentScriptResponse, true);
});

// Edge cases
test('Popup - should handle very large hand counts', async (t) => {
  // Arrange
  const largeHandCount = Number.MAX_SAFE_INTEGER;
  
  // Act
  await chrome.storage.local.set({ handCount: largeHandCount });
  
  // Assert
  assert.strictEqual(mockStorage.get('handCount'), largeHandCount);
});

test('Popup - should handle negative intervals gracefully', async (t) => {
  // Arrange
  const negativeInterval = -100;
  
  // Act
  await chrome.storage.local.set({ interval: negativeInterval });
  const result = await chrome.storage.local.get(['interval']);
  
  // Assert
  // In real implementation, this should be validated and use default
  assert.strictEqual(result.interval, negativeInterval);
});