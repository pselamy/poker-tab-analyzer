"""
Platform factory for creating platform-specific detectors.
"""

from typing import Dict, Type, Optional
from .global_poker import GlobalPokerDetector

# Registry of supported platforms
PLATFORM_REGISTRY: Dict[str, Type] = {
    "global_poker": GlobalPokerDetector,
    # Add more platforms here as they're implemented
    # "pokerstars": PokerStarsDetector,
    # "ggpoker": GGPokerDetector,
}

class PlatformFactory:
    """Factory for creating platform-specific detector instances."""
    
    @staticmethod
    def create_detector(platform_name: str) -> Optional[object]:
        """
        Create a detector instance for the specified platform.
        
        Args:
            platform_name: Name of the platform (e.g., "global_poker")
            
        Returns:
            Platform detector instance or None if platform not supported
        """
        platform_name = platform_name.lower().replace(" ", "_")
        
        if platform_name in PLATFORM_REGISTRY:
            detector_class = PLATFORM_REGISTRY[platform_name]
            return detector_class()
        else:
            print(f"Platform '{platform_name}' not supported. Available platforms:")
            for platform in PLATFORM_REGISTRY:
                print(f"  - {platform}")
            return None
    
    @staticmethod
    def list_platforms() -> list:
        """Get list of supported platforms."""
        return list(PLATFORM_REGISTRY.keys())
