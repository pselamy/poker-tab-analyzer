"""
Screenshot capture module for Chrome tabs.
Handles taking screenshots of browser tabs at regular intervals.
"""

import time
from typing import Optional, Union
import numpy as np
from PIL import Image
import pyautogui

class ChromeScreenshotCapture:
    """Captures screenshots from Chrome browser tabs."""
    
    def __init__(self, tab_name: Optional[str] = None):
        """
        Initialize the screenshot capture.
        
        Args:
            tab_name: Specific tab name to capture. If None, captures active tab.
        """
        self.tab_name = tab_name
        self.last_capture_time = 0
        
    def capture(self) -> np.ndarray:
        """
        Capture a screenshot of the Chrome tab.
        
        Returns:
            numpy array representing the captured image
        """
        # TODO: Implement Chrome-specific capture
        # For now, using pyautogui as placeholder
        screenshot = pyautogui.screenshot()
        return np.array(screenshot)
        
    def capture_region(self, x: int, y: int, width: int, height: int) -> np.ndarray:
        """
        Capture a specific region of the screen.
        
        Args:
            x, y: Top-left coordinates
            width, height: Dimensions of the region
            
        Returns:
            numpy array of the captured region
        """
        screenshot = pyautogui.screenshot(region=(x, y, width, height))
        return np.array(screenshot)
