"""
Generic card detector using computer vision.
Works with any poker platform by detecting cards visually.
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass
import pytesseract

@dataclass
class Card:
    """Represents a detected playing card."""
    rank: str  # 2-9, T, J, Q, K, A
    suit: str  # c, d, h, s
    confidence: float
    location: Tuple[int, int, int, int]  # x, y, w, h
    
    def __str__(self):
        return f"{self.rank}{self.suit}"

@dataclass
class DetectedTable:
    """Represents detected poker table elements."""
    cards: List[Card]
    pot_text: Optional[str]
    button_position: Optional[Tuple[int, int]]
    player_stacks: List[Tuple[int, int, str]]  # x, y, stack_text
    
class UniversalCardDetector:
    """Generic card detector that works with any poker platform."""
    
    def __init__(self):
        # Card detection parameters
        self.min_card_area = 1000  # Minimum area for a card
        self.card_aspect_ratio = 0.7  # Expected width/height ratio
        self.rank_patterns = self._create_rank_patterns()
        self.suit_colors = {
            'hearts': ([0, 0, 150], [10, 255, 255]),    # Red
            'diamonds': ([0, 0, 150], [10, 255, 255]),   # Red  
            'clubs': ([0, 0, 0], [180, 255, 30]),        # Black
            'spades': ([0, 0, 0], [180, 255, 30])        # Black
        }
        
    def _create_rank_patterns(self) -> Dict[str, List[str]]:
        """Create OCR patterns for rank detection."""
        return {
            '2': ['2'],
            '3': ['3'],
            '4': ['4'],
            '5': ['5'],
            '6': ['6'],
            '7': ['7'],
            '8': ['8'],
            '9': ['9'],
            'T': ['10', '1O', 'T'],
            'J': ['J', 'j'],
            'Q': ['Q', 'q'],
            'K': ['K', 'k'],
            'A': ['A', 'a', '1']
        }
    
    def detect_cards(self, screenshot: np.ndarray) -> List[Card]:
        """
        Detect all visible cards in the screenshot using computer vision.
        
        Args:
            screenshot: Screenshot as numpy array (BGR format)
            
        Returns:
            List of detected cards
        """
        cards = []
        
        # Find card-like rectangles
        card_regions = self._find_card_regions(screenshot)
        
        # Analyze each potential card
        for region in card_regions:
            card = self._analyze_card_region(screenshot, region)
            if card:
                cards.append(card)
                
        return cards
    
    def _find_card_regions(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Find potential card regions using contour detection."""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        card_regions = []
        for contour in contours:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by size and aspect ratio
            area = w * h
            if area < self.min_card_area:
                continue
                
            aspect_ratio = w / h if h > 0 else 0
            if 0.5 < aspect_ratio < 0.8:  # Typical card aspect ratio
                card_regions.append((x, y, w, h))
                
        return card_regions
    
    def _analyze_card_region(self, image: np.ndarray, region: Tuple[int, int, int, int]) -> Optional[Card]:
        """Analyze a region to determine if it's a card and extract rank/suit."""
        x, y, w, h = region
        card_img = image[y:y+h, x:x+w]
        
        # Look for rank in top-left corner
        rank_region = card_img[0:int(h*0.3), 0:int(w*0.3)]
        rank = self._detect_rank(rank_region)
        
        if not rank:
            return None
            
        # Look for suit below rank
        suit_region = card_img[int(h*0.2):int(h*0.5), 0:int(w*0.3)]
        suit = self._detect_suit(suit_region)
        
        if not suit:
            return None
            
        return Card(rank=rank, suit=suit, confidence=0.8, location=region)
    
    def _detect_rank(self, region: np.ndarray) -> Optional[str]:
        """Detect card rank using OCR and pattern matching."""
        # Preprocess for OCR
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
        
        # Use OCR
        try:
            text = pytesseract.image_to_string(thresh, config='--psm 8 -c tessedit_char_whitelist=23456789TJQKA')
            text = text.strip().upper()
            
            # Match against known patterns
            for rank, patterns in self.rank_patterns.items():
                if any(pattern in text for pattern in patterns):
                    return rank
        except:
            pass
            
        return None
    
    def _detect_suit(self, region: np.ndarray) -> Optional[str]:
        """Detect card suit using color and shape analysis."""
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
        
        # Check for red (hearts/diamonds) or black (clubs/spades)
        red_mask = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([10, 255, 255]))
        red_mask2 = cv2.inRange(hsv, np.array([170, 50, 50]), np.array([180, 255, 255]))
        red_mask = red_mask | red_mask2
        
        black_mask = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 30]))
        
        red_pixels = cv2.countNonZero(red_mask)
        black_pixels = cv2.countNonZero(black_mask)
        
        # Simple classification - can be improved with shape detection
        if red_pixels > black_pixels:
            # Further distinguish hearts vs diamonds using shape
            return 'h'  # Simplified for now
        else:
            # Further distinguish clubs vs spades using shape  
            return 's'  # Simplified for now
    
    def detect_table_elements(self, screenshot: np.ndarray) -> DetectedTable:
        """
        Detect all poker table elements in a screenshot.
        
        Args:
            screenshot: Screenshot as numpy array
            
        Returns:
            DetectedTable with all detected elements
        """
        # Detect cards
        cards = self.detect_cards(screenshot)
        
        # Detect pot (look for text with currency symbols or "Pot:")
        pot_text = self._detect_pot(screenshot)
        
        # Detect dealer button (small circular object)
        button_pos = self._detect_dealer_button(screenshot)
        
        # Detect player stacks (numbers near edges of screen)
        stacks = self._detect_player_stacks(screenshot)
        
        return DetectedTable(
            cards=cards,
            pot_text=pot_text,
            button_position=button_pos,
            player_stacks=stacks
        )
    
    def _detect_pot(self, image: np.ndarray) -> Optional[str]:
        """Detect pot size using OCR on central area."""
        h, w = image.shape[:2]
        
        # Focus on center area where pot is usually displayed
        center_region = image[int(h*0.3):int(h*0.5), int(w*0.3):int(w*0.7)]
        
        # Preprocess
        gray = cv2.cvtColor(center_region, cv2.COLOR_BGR2GRAY)
        
        # Look for text
        try:
            text = pytesseract.image_to_string(gray)
            # Look for patterns like "Pot: $100" or just numbers with currency
            import re
            pot_match = re.search(r'(?:Pot:?\s*)?([$€£]?\d+(?:,\d{3})*(?:\.\d{2})?)', text)
            if pot_match:
                return pot_match.group(1)
        except:
            pass
            
        return None
    
    def _detect_dealer_button(self, image: np.ndarray) -> Optional[Tuple[int, int]]:
        """Detect dealer button using circle detection."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect circles
        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=50,
            param1=50,
            param2=30,
            minRadius=10,
            maxRadius=30
        )
        
        if circles is not None:
            circles = np.uint16(np.around(circles))
            # Return the first detected circle (can be improved)
            if len(circles[0]) > 0:
                x, y, r = circles[0][0]
                return (int(x), int(y))
                
        return None
    
    def _detect_player_stacks(self, image: np.ndarray) -> List[Tuple[int, int, str]]:
        """Detect player chip stacks around the table."""
        stacks = []
        h, w = image.shape[:2]
        
        # Define regions where stacks typically appear (around edges)
        regions = [
            (int(w*0.1), int(h*0.1), int(w*0.3), int(h*0.3)),  # Top-left
            (int(w*0.4), int(h*0.05), int(w*0.6), int(h*0.2)), # Top
            (int(w*0.7), int(h*0.1), int(w*0.9), int(h*0.3)),  # Top-right
            # Add more regions as needed
        ]
        
        for x1, y1, x2, y2 in regions:
            region = image[y1:y2, x1:x2]
            text = self._extract_number_text(region)
            if text:
                stacks.append((x1, y1, text))
                
        return stacks
    
    def _extract_number_text(self, region: np.ndarray) -> Optional[str]:
        """Extract numeric text from a region."""
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        try:
            text = pytesseract.image_to_string(gray, config='--psm 7 -c tessedit_char_whitelist=0123456789,$.')
            text = text.strip()
            if text and any(c.isdigit() for c in text):
                return text
        except:
            pass
        return None
