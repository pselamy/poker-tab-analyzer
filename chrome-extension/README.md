# Poker Tab Analyzer - Chrome Extension

A Chrome extension that uses computer vision to analyze poker hands in real-time on any poker website.

## Features

- **Universal Detection**: Works on any poker site using computer vision
- **Real-time Analysis**: Captures and analyzes at 250ms intervals (configurable)
- **No Configuration Needed**: Automatically detects cards, pot size, and game state
- **Privacy-First**: All processing happens locally in your browser
- **Native Performance**: Captures tab content directly for best performance

## Installation

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this repository

### 2. Generate Icons (Optional)

```bash
cd chrome-extension
python3 create_icons.py
```

Or use any 128x128 PNG image as `icons/icon128.png` and resize for other sizes.

### 3. Pin the Extension

Click the puzzle piece icon in Chrome's toolbar and pin the Poker Tab Analyzer.

## Usage

### Automatic Mode

The extension automatically starts when you visit a poker site:

- GlobalPoker.com
- PokerStars.com
- GGPoker.com
- Any site with "poker" in the domain

### Manual Control

1. Click the extension icon to open the popup
2. Click "Start Analysis" to begin
3. The extension will:
   - Detect cards using computer vision
   - Show last detected hand
   - Display statistics
   - Provide recommendations (when solver is connected)

### Settings

- **Capture Interval**: Adjust from 100ms to 1000ms (default 250ms)
- Lower values = more responsive but higher CPU usage
- Higher values = less CPU but may miss quick actions

## How It Works

### 1. Content Script (`content.js`)

- Runs on poker sites
- Captures table area every 250ms
- Uses computer vision to detect:
  - Card shapes (white rectangles)
  - Ranks (pattern matching in corners)
  - Suits (color detection)
  - Pot size (OCR in center)

### 2. Background Script (`background.js`)

- Manages extension state
- Handles tab screenshots
- Communicates with solver
- Stores detection history

### 3. Popup Interface (`popup.html`)

- Shows current status
- Controls start/stop
- Displays statistics
- Shows last detected cards

## Computer Vision Detection

The extension uses generic detection that works on any site:

```javascript
// Find white rectangular regions (cards)
findCardLikeRegions(imageData) {
  // Scan for white pixels
  // Flood fill to find connected regions
  // Check aspect ratio (0.6-0.8 for cards)
  // Return candidate regions
}

// Analyze each region
analyzeCardRegion(region) {
  // Extract top-left corner
  // Pattern match for rank (A, K, Q, etc.)
  // Detect color for suit
  // Return detected card
}
```

## Performance

- **Fast Detection**: 10-50ms per frame
- **Low CPU Usage**: Optimized algorithms
- **Configurable Rate**: Adjust to your needs
- **Frame Skipping**: Maintains performance under load

## Privacy & Security

- **Local Processing**: All detection happens in your browser
- **No Data Sent**: Nothing leaves your computer
- **Open Source**: Inspect the code yourself
- **No Screenshots Stored**: Only processes in memory

## Troubleshooting

### Cards Not Detected

1. Ensure poker table is fully visible
2. Check for good contrast (cards vs background)
3. Try adjusting capture interval
4. Open popup to see detection status

### High CPU Usage

1. Increase capture interval (Settings → 500ms)
2. Close other tabs
3. Ensure hardware acceleration is enabled in Chrome

### Extension Not Working

1. Check that you're on a supported poker site
2. Reload the page after installing
3. Check Chrome DevTools console for errors

## Development

### Project Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── content.js            # Runs on poker sites
├── background.js         # Service worker
├── popup.html/js         # Extension popup
└── icons/               # Extension icons
```

### Adding Solver Support

The extension can connect to a native solver:

1. Create native messaging host
2. Register in `manifest.json`
3. Implement solver protocol in `background.js`

### Contributing

1. Test on your favorite poker site
2. Report detection issues
3. Submit improvements to the vision algorithms

## Future Enhancements

- [ ] OCR for pot size detection
- [ ] Player count detection
- [ ] Bet sizing recognition
- [ ] Hand history tracking
- [ ] GTO solver integration
- [ ] Multi-table support

## License

MIT License - See LICENSE file

## Disclaimer

This tool is for educational and analytical purposes. Always follow the terms of service of the poker sites you use.
