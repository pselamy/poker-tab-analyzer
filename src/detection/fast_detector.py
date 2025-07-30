"""
Fast card detection using optimized computer vision techniques.
Designed for real-time performance at 250ms intervals.
"""

import cv2
import numpy as np
from typing import List, Set, Tuple, Optional
from collections import deque
import time

class FastCardDetector:
    """Optimized card detector for real-time performance."""
    
    def __init__(self):
        # Performance optimization settings
        self.scale_factor = 0.5  # Downscale for faster processing
        self.card_cache = {}  # Cache detected cards
        self.last_cards = set()  # Track previous frame's cards
        self.stable_cards = set()  # Cards that appear consistently
        self.history = deque(maxlen=3)  # Frame history for stability
        
        # Simplified card templates (rank only for speed)
        self.rank_templates = self._load_rank_templates()
        
    def _load_rank_templates(self) -> dict:
        """Load or create simple rank templates."""
        # In production, these would be loaded from files
        # For now, using simplified patterns
        return {
            'A': np.array([[1,1,1], [1,0,1], [1,1,1], [1,0,1], [1,0,1]]),
            'K': np.array([[1,0,1], [1,1,0], [1,1,0], [1,0,1], [1,0,1]]),
            'Q': np.array([[0,1,0], [1,0,1], [1,0,1], [0,1,1], [0,0,1]]),
            'J': np.array([[0,0,1], [0,0,1], [0,0,1], [1,0,1], [0,1,0]]),
            # Add more as needed
        }
        
    def detect_cards_fast(self, screenshot: np.ndarray) -> Set[str]:
        """
        Fast card detection optimized for real-time performance.
        
        Args:
            screenshot: Screenshot as numpy array
            
        Returns:
            Set of detected cards as strings (e.g., {'Ah', 'Ks'})
        """
        start_time = time.time()
        
        # Downscale for speed
        if self.scale_factor < 1.0:
            small = cv2.resize(screenshot, None, fx=self.scale_factor, fy=self.scale_factor)
        else:
            small = screenshot
            
        # Quick card detection using color and shape
        cards = self._quick_card_detection(small)
        
        # Update history for stability
        self.history.append(cards)
        
        # Only return cards that appear in multiple frames
        stable_cards = set()
        if len(self.history) >= 2:
            stable_cards = set.intersection(*self.history)
            
        # Performance tracking
        elapsed = time.time() - start_time
        if elapsed > 0.1:  # Log if taking too long
            print(f"Card detection took {elapsed:.3f}s (target: <0.1s)")
            
        return stable_cards
    
    def _quick_card_detection(self, image: np.ndarray) -> Set[str]:
        """Quick card detection using color filtering and contours."""
        cards = set()
        
        # Convert to HSV
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Look for white/light colored rectangles (cards)
        lower_white = np.array([0, 0, 200])
        upper_white = np.array([180, 30, 255])
        mask = cv2.inRange(hsv, lower_white, upper_white)
        
        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Quick filtering
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 500 * (self.scale_factor ** 2):  # Adjusted for scale
                continue
                
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            aspect = w / h if h > 0 else 0
            
            if 0.5 < aspect < 0.8:  # Card-like aspect ratio
                # Extract region
                roi = image[y:y+h, x:x+w]
                
                # Quick rank detection
                rank = self._quick_rank_detection(roi)
                if rank:
                    # Simplified - just return rank for now
                    cards.add(rank)
                    
        return cards
    
    def _quick_rank_detection(self, card_region: np.ndarray) -> Optional[str]:
        """Quick rank detection using template matching."""
        # Focus on top-left corner
        h, w = card_region.shape[:2]
        corner = card_region[0:int(h*0.3), 0:int(w*0.3)]
        
        # Convert to grayscale
        gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)
        
        # Simple threshold
        _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
        
        # Quick template matching (simplified)
        # In production, use actual template matching
        white_pixels = cv2.countNonZero(binary)
        total_pixels = binary.size
        
        if total_pixels > 0:
            ratio = white_pixels / total_pixels
            
            # Very simple heuristic (to be replaced with real matching)
            if ratio > 0.7:
                return 'A'  # Placeholder
            elif ratio > 0.5:
                return 'K'  # Placeholder
                
        return None
    
    def clear_cache(self):
        """Clear detection cache and history."""
        self.card_cache.clear()
        self.last_cards.clear()
        self.stable_cards.clear()
        self.history.clear()
