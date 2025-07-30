#!/usr/bin/env python3
"""
Poker Tab Analyzer - Generic poker platform analyzer
Uses computer vision to work with any poker platform.
"""

import time
import json
import argparse
from datetime import datetime
import numpy as np

# Import our detection modules
from src.detection.universal_detector import UniversalCardDetector, DetectedTable
from src.detection.fast_detector import FastCardDetector
from src.capture.screenshot import ChromeScreenshotCapture

class PokerAnalyzer:
    """Generic poker analyzer that works with any platform."""
    
    def __init__(self, config_file='config.json'):
        """Initialize the analyzer."""
        self.config = self.load_config(config_file)
        self.is_running = False
        
        # Initialize components
        self.screenshot_capture = ChromeScreenshotCapture()
        
        # Choose detector based on performance needs
        if self.config.get('use_fast_detector', True):
            self.detector = FastCardDetector()
            print("Using fast detector for real-time performance")
        else:
            self.detector = UniversalCardDetector()
            print("Using universal detector for accuracy")
            
        # Poker solver (to be implemented)
        # self.solver = PokerSolver()
        
        # Performance tracking
        self.frame_times = []
        self.detection_times = []
        
    def load_config(self, config_file):
        """Load configuration."""
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Config file {config_file} not found. Using defaults.")
            return self.get_default_config()
            
    def get_default_config(self):
        """Return default configuration."""
        return {
            "screenshot_interval_ms": 250,
            "use_fast_detector": True,
            "show_debug_window": False,
            "detection_confidence": 0.8,
            "solver_settings": {
                "consider_pot_odds": True
            }
        }
    
    def run(self):
        """Main analysis loop."""
        self.is_running = True
        interval_seconds = self.config['screenshot_interval_ms'] / 1000.0
        
        print(f"Starting Poker Analyzer...")
        print(f"Screenshot interval: {self.config['screenshot_interval_ms']}ms")
        print("Press Ctrl+C to stop")
        
        try:
            while self.is_running:
                loop_start = time.time()
                
                # Capture screenshot
                screenshot = self.screenshot_capture.capture()
                capture_time = time.time() - loop_start
                
                # Detect cards and table elements
                detection_start = time.time()
                
                if isinstance(self.detector, FastCardDetector):
                    # Fast detection for real-time
                    cards = self.detector.detect_cards_fast(screenshot)
                    self._process_fast_detection(cards)
                else:
                    # Full detection with all elements
                    table = self.detector.detect_table_elements(screenshot)
                    self._process_full_detection(table)
                    
                detection_time = time.time() - detection_start
                
                # Track performance
                self.frame_times.append(time.time() - loop_start)
                self.detection_times.append(detection_time)
                
                # Show debug window if enabled
                if self.config.get('show_debug_window', False):
                    self._show_debug_window(screenshot)
                
                # Maintain target frame rate
                elapsed = time.time() - loop_start
                sleep_time = max(0, interval_seconds - elapsed)
                if sleep_time > 0:
                    time.sleep(sleep_time)
                else:
                    print(f"Warning: Processing took {elapsed:.3f}s, target is {interval_seconds:.3f}s")
                    
        except KeyboardInterrupt:
            print("\nStopping analyzer...")
            self.stop()
            
    def _process_fast_detection(self, cards: set):
        """Process results from fast detection."""
        if cards:
            print(f"[{datetime.now().strftime('%H:%M:%S.%f')[:-3]}] Cards detected: {cards}")
            # TODO: Send to solver for analysis
            
    def _process_full_detection(self, table: DetectedTable):
        """Process results from full detection."""
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        
        if table.cards:
            card_str = ", ".join(str(card) for card in table.cards)
            print(f"[{timestamp}] Cards: {card_str}")
            
        if table.pot_text:
            print(f"[{timestamp}] Pot: {table.pot_text}")
            
        # TODO: Send to solver for analysis
        
    def _show_debug_window(self, screenshot: np.ndarray):
        """Show debug window with detections."""
        import cv2
        # This would show detected regions, cards, etc.
        # For now, just show the screenshot
        cv2.imshow('Poker Analyzer Debug', screenshot)
        cv2.waitKey(1)
        
    def stop(self):
        """Stop the analyzer and show statistics."""
        self.is_running = False
        
        # Show performance statistics
        if self.frame_times:
            avg_frame_time = np.mean(self.frame_times) * 1000
            avg_detection_time = np.mean(self.detection_times) * 1000
            
            print(f"\nPerformance Statistics:")
            print(f"Average frame time: {avg_frame_time:.1f}ms")
            print(f"Average detection time: {avg_detection_time:.1f}ms")
            print(f"Average FPS: {1000/avg_frame_time:.1f}")

def main():
    """Entry point."""
    parser = argparse.ArgumentParser(description='Generic Poker Analyzer')
    parser.add_argument('-c', '--config', default='config.json',
                        help='Configuration file path')
    parser.add_argument('--debug', action='store_true',
                        help='Show debug window')
    parser.add_argument('--slow', action='store_true',
                        help='Use accurate detector instead of fast')
    
    args = parser.parse_args()
    
    # Create analyzer
    analyzer = PokerAnalyzer(config_file=args.config)
    
    # Override config with command line args
    if args.debug:
        analyzer.config['show_debug_window'] = True
    if args.slow:
        analyzer.config['use_fast_detector'] = False
        analyzer.detector = UniversalCardDetector()
        
    # Run
    analyzer.run()

if __name__ == '__main__':
    main()
