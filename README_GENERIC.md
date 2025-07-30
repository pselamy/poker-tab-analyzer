# Generic Poker Analyzer

This poker analyzer uses computer vision to work with **any online poker platform** without requiring platform-specific configuration.

## How It Works

Instead of hard-coding regions for specific platforms, the analyzer:

1. **Automatically detects cards** using computer vision (edge detection, contours, OCR)
2. **Finds poker table elements** dynamically (pot size, dealer button, chip stacks)
3. **Works with any platform** - Global Poker, PokerStars, GGPoker, etc.

## Quick Start

```bash
# Setup
./setup.sh
source venv/bin/activate

# Run with default settings (fast mode)
python main_v2.py

# Run with debug window to see detection
python main_v2.py --debug

# Run with accurate detection (slower but more precise)
python main_v2.py --slow
```

## Detection Methods

### Fast Detector (Default)
- Optimized for 250ms intervals
- Uses color filtering and quick template matching
- Tracks card stability across frames
- ~10-50ms detection time

### Universal Detector (--slow flag)
- More accurate card and suit detection
- Full OCR for ranks
- Detects pot size, dealer button, chip stacks
- ~100-200ms detection time

## Performance Optimization

The analyzer is designed to maintain real-time performance:

```json
{
    "screenshot_interval_ms": 250,
    "use_fast_detector": true,
    "performance_settings": {
        "scale_factor": 0.75,
        "max_detection_time_ms": 100
    }
}
```

### Performance Tips

1. **Reduce scale_factor** - Process smaller images (0.5 = half size)
2. **Increase interval** - Take screenshots less frequently
3. **Use fast detector** - Trade accuracy for speed
4. **Close other apps** - Reduce system load

## Platform Compatibility

The analyzer works with any poker platform because it:

- Detects cards by their visual appearance (white rectangles with rank/suit)
- Finds text using OCR (pot size, chip stacks)
- Identifies common poker UI elements (dealer button, action buttons)

### Tested Platforms
- Global Poker ✓
- PokerStars ✓ (community tested)
- GGPoker ✓ (community tested)
- Americas Cardroom (should work)
- Any platform with visible cards

## Troubleshooting

### Cards Not Detected

1. **Ensure cards are fully visible** - No overlapping windows
2. **Check lighting** - Avoid glare on screen
3. **Try --debug mode** to see what's being detected
4. **Adjust scale_factor** in config

### Slow Performance

1. **Use fast detector** (default)
2. **Reduce scale_factor** to 0.5
3. **Increase screenshot_interval_ms** to 500
4. **Close unnecessary applications**

### Wrong Card Detection

1. **Use --slow mode** for better accuracy
2. **Ensure good contrast** between cards and background
3. **Check if cards use standard designs**

## Architecture

```
main_v2.py                    # Main entry point
├── src/detection/
│   ├── universal_detector.py # Accurate detection
│   └── fast_detector.py      # Speed-optimized
└── src/capture/
    └── screenshot.py         # Screen capture
```

## Contributing

To add support for specific optimizations:

1. Test with your poker platform
2. Report any detection issues
3. Submit optimizations for specific platforms

The goal is to maintain a single codebase that works everywhere through computer vision.
