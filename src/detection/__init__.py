# Card detection module
"""
Generic card detection using computer vision.
Works with any poker platform.
"""

from .universal_detector import UniversalCardDetector, Card, DetectedTable
from .fast_detector import FastCardDetector

__all__ = [
    'UniversalCardDetector',
    'FastCardDetector', 
    'Card',
    'DetectedTable'
]
