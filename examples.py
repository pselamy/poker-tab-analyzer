#!/usr/bin/env python3
"""
Example: Using the poker analyzer as a library
"""

import cv2
import numpy as np
from src.detection import UniversalCardDetector, FastCardDetector
from src.capture.screenshot import ChromeScreenshotCapture

def example_basic_usage():
    """Basic example of using the detector."""
    print("=== Basic Card Detection Example ===\n")
    
    # Create a detector
    detector = UniversalCardDetector()
    
    # Capture a screenshot (or load an image)
    capture = ChromeScreenshotCapture()
    screenshot = capture.capture()
    
    # Detect poker elements
    table = detector.detect_table_elements(screenshot)
    
    # Process results
    if table.cards:
        print(f"Found {len(table.cards)} cards:")
        for card in table.cards:
            print(f"  {card.rank}{card.suit} (confidence: {card.confidence:.2f})")
    
    if table.pot_text:
        print(f"\nPot size: {table.pot_text}")

def example_fast_detection():
    """Example using the fast detector for real-time analysis."""
    print("\n=== Fast Detection Example ===\n")
    
    detector = FastCardDetector()
    capture = ChromeScreenshotCapture()
    
    # Simulate multiple frames
    print("Detecting cards across multiple frames...")
    for i in range(5):
        screenshot = capture.capture()
        cards = detector.detect_cards_fast(screenshot)
        
        if cards:
            print(f"Frame {i+1}: {cards}")
        else:
            print(f"Frame {i+1}: No cards detected")
            
def example_custom_processing():
    """Example of custom image processing."""
    print("\n=== Custom Processing Example ===\n")
    
    # Load an image
    image_path = "poker_screenshot.png"
    
    try:
        image = cv2.imread(image_path)
        if image is None:
            print(f"No image found at {image_path}")
            print("Using live screenshot instead...")
            capture = ChromeScreenshotCapture()
            image = capture.capture()
    except:
        capture = ChromeScreenshotCapture()
        image = capture.capture()
    
    # Create detector
    detector = UniversalCardDetector()
    
    # Detect just cards (not full table)
    cards = detector.detect_cards(image)
    
    # Draw detection boxes
    for card in cards:
        x, y, w, h = card.location
        cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(image, str(card), (x, y-10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    
    # Save result
    cv2.imwrite("detected_cards.png", image)
    print(f"Saved detection result to detected_cards.png")

def example_performance_testing():
    """Example of testing detection performance."""
    print("\n=== Performance Testing ===\n")
    
    import time
    
    # Test both detectors
    detectors = {
        "Universal": UniversalCardDetector(),
        "Fast": FastCardDetector()
    }
    
    capture = ChromeScreenshotCapture()
    screenshot = capture.capture()
    
    for name, detector in detectors.items():
        times = []
        
        # Run multiple iterations
        for _ in range(10):
            start = time.time()
            
            if hasattr(detector, 'detect_cards_fast'):
                detector.detect_cards_fast(screenshot)
            else:
                detector.detect_cards(screenshot)
                
            times.append((time.time() - start) * 1000)
        
        avg_time = np.mean(times)
        print(f"{name} Detector:")
        print(f"  Average time: {avg_time:.1f}ms")
        print(f"  Min time: {min(times):.1f}ms")
        print(f"  Max time: {max(times):.1f}ms")
        print(f"  Can handle {1000/avg_time:.1f} FPS")

if __name__ == "__main__":
    print("Poker Analyzer Examples")
    print("=" * 50)
    
    # Run examples
    example_basic_usage()
    example_fast_detection()
    example_custom_processing()
    example_performance_testing()
    
    print("\n" + "=" * 50)
    print("Examples complete!")
