# Migration Guide: Platform-Specific → Generic Detection

## Overview

We've refactored the poker analyzer from a platform-specific approach to a generic computer vision solution that works with any poker platform.

## Key Changes

### Before (Platform-Specific)
```python
# Required platform configuration
{
    "platform": "global_poker",
    "platform_settings": {
        "global_poker": {
            "table_regions": {...}
        }
    }
}

# Platform-specific detectors
detector = GlobalPokerDetector()
```

### After (Generic)
```python
# No platform specification needed
{
    "use_fast_detector": true,
    "screenshot_interval_ms": 250
}

# Universal detectors
detector = UniversalCardDetector()  # Works everywhere
```

## What Changed

1. **No Platform Configuration** - The analyzer now detects cards and table elements visually
2. **Two Detection Modes**:
   - Fast mode (default): Optimized for real-time at 250ms intervals
   - Accurate mode: Better detection with slightly higher latency
3. **Dynamic Detection** - Cards, pot, and buttons are found using computer vision
4. **Better Performance** - Fast detector typically runs in 10-50ms

## How to Migrate

1. **Use the new main file**:
   ```bash
   python main_v2.py  # Instead of main.py
   ```

2. **Update your config**:
   ```bash
   cp config_generic.json config.json
   ```

3. **Remove platform-specific settings** from your config

4. **Test the detection**:
   ```bash
   python test_generic_detection.py
   ```

## Benefits

- ✅ Works with ANY poker platform
- ✅ No configuration needed for new platforms  
- ✅ Better performance with fast detector
- ✅ More maintainable codebase
- ✅ Community can contribute improvements that benefit everyone

## Compatibility

The new system works with:
- Global Poker
- PokerStars
- GGPoker
- Americas Cardroom
- Any platform with visible cards

## Need Platform-Specific Features?

If you need platform-specific optimizations:

1. The old code is preserved in `src/platforms_old/`
2. You can extend the universal detector with platform hints
3. Consider contributing optimizations that benefit all platforms

## Questions?

Check the [Generic Poker Analyzer README](README_GENERIC.md) for detailed documentation.
