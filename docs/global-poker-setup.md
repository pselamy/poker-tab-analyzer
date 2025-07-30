# Global Poker Setup Guide

This guide will help you set up the Poker Tab Analyzer specifically for Global Poker.

## Prerequisites

1. **Chrome Browser**: Ensure you're using Google Chrome
2. **Global Poker Account**: Log in to your Global Poker account
3. **Table Settings**: For best results, use these settings in Global Poker:
   - Table theme: Classic Green (most tested)
   - Four-color deck: Enabled (helps with suit detection)
   - Card size: Standard or Large

## Initial Setup

### 1. Configure for Global Poker

The default configuration is already set for Global Poker. If you need to modify it:

```json
{
    "platform": "global_poker",
    "platform_settings": {
        "global_poker": {
            "auto_detect_currency": true,
            "default_currency": "GC",
            "table_theme": "green"
        }
    }
}
```

### 2. Window Positioning

For best results:
- Run Global Poker in a dedicated Chrome window (not a tab among many)
- Avoid overlapping windows
- Use fullscreen mode or ensure the entire poker table is visible

### 3. Creating Card Templates

The analyzer needs template images of Global Poker's cards:

1. Join a play money table (to avoid disrupting real games)
2. Take screenshots when cards are clearly visible
3. Crop and save card templates following the structure in `card_templates/README.md`

## Running the Analyzer

```bash
# Activate virtual environment
source venv/bin/activate

# Start the analyzer
python main.py

# The analyzer will:
# 1. Look for a Chrome tab with Global Poker
# 2. Start capturing screenshots every 250ms
# 3. Detect your cards and the game state
# 4. Provide strategy recommendations
```

## Troubleshooting

### Issue: Table not detected
- **Solution**: Ensure the entire poker table is visible in the browser window
- Try the calibration command: `python calibrate.py --platform global_poker`

### Issue: Cards not recognized
- **Solution**: Check that card templates are properly created
- Verify four-color deck is enabled in Global Poker settings
- Ensure cards are not overlapped by chat or other UI elements

### Issue: Wrong currency detected (GC vs SC)
- **Solution**: Manually set currency in config:
  ```json
  "auto_detect_currency": false,
  "default_currency": "SC"
  ```

## Global Poker Specific Features

### Multi-Table Support
The analyzer can track multiple Global Poker tables:
```bash
python main.py --multi-table
```

### Tournament vs Cash Game
The analyzer automatically detects tournament vs cash game format and adjusts strategy accordingly.

### Gold Coins vs Sweeps Cash
- **Gold Coins (GC)**: Play money mode, good for testing
- **Sweeps Cash (SC)**: Real money equivalent, be careful with bankroll management

## Legal Disclaimer

This tool is designed for educational and analytical purposes. Always follow Global Poker's Terms of Service. The use of automated tools may be restricted - verify with Global Poker's current policies.

## Support

For Global Poker specific issues:
- Check the [GitHub Issues](https://github.com/pselamy/poker-tab-analyzer/issues) page
- Tag issues with `global-poker` label
- Include screenshots of any detection problems
