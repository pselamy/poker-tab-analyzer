#!/usr/bin/env python3
"""
Test script for Global Poker detection.
Run this to verify your setup is working correctly.
"""

import sys
import time
from datetime import datetime

def test_global_poker_setup():
    """Test the Global Poker setup and configuration."""
    print("=" * 60)
    print("Global Poker Setup Test")
    print("=" * 60)
    
    # Test 1: Check Python version
    print("\n1. Checking Python version...")
    python_version = sys.version_info
    if python_version.major >= 3 and python_version.minor >= 8:
        print(f"   ✅ Python {python_version.major}.{python_version.minor} - OK")
    else:
        print(f"   ❌ Python {python_version.major}.{python_version.minor} - Please use Python 3.8+")
        return False
    
    # Test 2: Check imports
    print("\n2. Checking required modules...")
    modules_to_check = [
        ("numpy", "NumPy"),
        ("cv2", "OpenCV"),
        ("PIL", "Pillow"),
        ("pyautogui", "PyAutoGUI")
    ]
    
    all_modules_ok = True
    for module_name, display_name in modules_to_check:
        try:
            __import__(module_name)
            print(f"   ✅ {display_name} - OK")
        except ImportError:
            print(f"   ❌ {display_name} - Not installed")
            all_modules_ok = False
    
    if not all_modules_ok:
        print("\n   Run: pip install -r requirements.txt")
        return False
    
    # Test 3: Check configuration
    print("\n3. Checking configuration...")
    try:
        import json
        with open('config.json', 'r') as f:
            config = json.load(f)
            platform = config.get('platform', 'unknown')
            if platform == 'global_poker':
                print(f"   ✅ Platform set to: {platform}")
            else:
                print(f"   ⚠️  Platform set to: {platform} (expected: global_poker)")
    except FileNotFoundError:
        print("   ❌ config.json not found - Copy config.example.json")
        return False
    except json.JSONDecodeError:
        print("   ❌ config.json is invalid JSON")
        return False
    
    # Test 4: Check Chrome
    print("\n4. Checking Chrome browser...")
    try:
        import subprocess
        result = subprocess.run(['google-chrome', '--version'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"   ✅ Chrome found: {result.stdout.strip()}")
        else:
            # Try alternative Chrome commands
            for cmd in ['chrome', 'chromium', 'chromium-browser']:
                try:
                    result = subprocess.run([cmd, '--version'], 
                                          capture_output=True, text=True)
                    if result.returncode == 0:
                        print(f"   ✅ Chrome found ({cmd}): {result.stdout.strip()}")
                        break
                except:
                    continue
            else:
                print("   ⚠️  Chrome not found in PATH")
    except:
        print("   ⚠️  Could not check Chrome installation")
    
    # Test 5: Test screenshot capability
    print("\n5. Testing screenshot capability...")
    try:
        import pyautogui
        screenshot = pyautogui.screenshot()
        print(f"   ✅ Screenshot successful: {screenshot.size}")
    except Exception as e:
        print(f"   ❌ Screenshot failed: {e}")
        return False
    
    # Test 6: Check Global Poker platform module
    print("\n6. Checking Global Poker module...")
    try:
        # Add parent directory to path for imports
        sys.path.insert(0, '.')
        from src.platforms.global_poker import GlobalPokerDetector, GlobalPokerLayout
        detector = GlobalPokerDetector()
        print("   ✅ Global Poker module loaded successfully")
        print(f"   - Default currency: {detector.currency_type}")
        print(f"   - Layout initialized: {detector.layout is not None}")
    except ImportError as e:
        print(f"   ❌ Failed to load Global Poker module: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ All tests passed! Ready to analyze Global Poker.")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Open Global Poker in Chrome")
    print("2. Join a table")
    print("3. Run: python main.py")
    
    return True

if __name__ == "__main__":
    test_global_poker_setup()
