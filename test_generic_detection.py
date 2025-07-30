#!/usr/bin/env python3
"""
Test the generic poker analyzer with a sample image or live capture.
"""

import sys
import cv2
import numpy as np
from datetime import datetime

# Add src to path
sys.path.insert(0, '.')

def test_detection():
    """Test card detection with various methods."""
    print("Generic Poker Analyzer Test")
    print("=" * 50)
    
    # Import detectors
    try:
        from src.detection.universal_detector import UniversalCardDetector
        from src.detection.fast_detector import FastCardDetector
        print("✓ Detectors imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import detectors: {e}")
        return
    
    # Test with screenshot
    print("\nTesting with screenshot capture...")
    try:
        import pyautogui
        screenshot = pyautogui.screenshot()
        screenshot_np = np.array(screenshot)
        screenshot_bgr = cv2.cvtColor(screenshot_np, cv2.COLOR_RGB2BGR)
        print(f"✓ Screenshot captured: {screenshot_bgr.shape}")
    except Exception as e:
        print(f"✗ Screenshot failed: {e}")
        # Create test image instead
        print("Creating test image...")
        screenshot_bgr = np.ones((800, 1200, 3), dtype=np.uint8) * 50
        
    # Test Universal Detector
    print("\n--- Testing Universal Detector ---")
    detector = UniversalCardDetector()
    
    start = datetime.now()
    table = detector.detect_table_elements(screenshot_bgr)
    elapsed = (datetime.now() - start).total_seconds() * 1000
    
    print(f"Detection time: {elapsed:.1f}ms")
    print(f"Cards found: {len(table.cards)}")
    for card in table.cards:
        print(f"  - {card}")
    if table.pot_text:
        print(f"Pot detected: {table.pot_text}")
    
    # Test Fast Detector
    print("\n--- Testing Fast Detector ---")
    fast_detector = FastCardDetector()
    
    start = datetime.now()
    cards = fast_detector.detect_cards_fast(screenshot_bgr)
    elapsed = (datetime.now() - start).total_seconds() * 1000
    
    print(f"Detection time: {elapsed:.1f}ms")
    print(f"Cards found: {cards}")
    
    # Performance comparison
    print("\n--- Performance Summary ---")
    print("Target: <100ms for 250ms interval (4 FPS)")
    print("Fast detector is optimized for real-time use")
    print("Universal detector provides more detailed analysis")
    
    # Test with sample poker image if available
    print("\n--- Testing with Sample Image ---")
    print("Place a poker screenshot at 'test_poker.png' to test")
    try:
        test_img = cv2.imread('test_poker.png')
        if test_img is not None:
            table = detector.detect_table_elements(test_img)
            print(f"Sample image - Cards found: {len(table.cards)}")
    except:
        print("No test image found")

if __name__ == "__main__":
    test_detection()
