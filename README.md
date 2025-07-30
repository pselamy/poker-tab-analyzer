# Poker Tab Analyzer

A real-time poker hand analyzer that uses computer vision to work with ANY online poker platform. Available as both a Chrome extension and standalone Python application.

## 🎯 Key Features

- **Universal Compatibility**: Works with any poker site using computer vision
- **Chrome Extension**: Native browser integration for best performance
- **Real-time Analysis**: 250ms detection intervals
- **No Configuration**: Automatically detects cards, pot size, and game state
- **Privacy-First**: All processing happens locally

## 🚀 Quick Start

### Option 1: Chrome Extension (Recommended)

1. **Install the extension**:
   ```bash
   cd chrome-extension
   # Open chrome://extensions in Developer mode
   # Click "Load unpacked" and select this folder
   ```

2. **Visit any poker site** and click the extension icon

3. **Start playing** - cards are detected automatically!

See [Chrome Extension README](chrome-extension/README.md) for full details.

### Option 2: Standalone Python

```bash
# Generic version (works anywhere)
python main_v2.py --debug

# Original version
python main.py
```

## 📁 Project Structure

```
poker-tab-analyzer/
├── chrome-extension/      # Browser extension (NEW!)
│   ├── manifest.json     # Extension config
│   ├── content.js        # Vision-based detection
│   ├── background.js     # Extension service worker
│   └── popup.html/js     # Control interface
├── native-host/          # Python solver bridge
├── src/
│   ├── detection/        # Computer vision modules
│   │   ├── universal_detector.py
│   │   └── fast_detector.py
│   └── capture/          # Screen capture
└── main_v2.py           # Standalone Python app
```

## 🎮 Supported Platforms

Works automatically with:
- Global Poker ✅
- PokerStars ✅
- GGPoker ✅
- Americas Cardroom ✅
- WSOP ✅
- Any poker site with visible cards ✅

## 🔧 How It Works

### Computer Vision Detection

Instead of hard-coding regions for each site, the analyzer:

1. **Finds card-shaped objects** (white rectangles)
2. **Detects ranks** using pattern matching
3. **Identifies suits** by color
4. **Locates pot size** using OCR
5. **Tracks game state** dynamically

### Chrome Extension Architecture

```javascript
// Content Script - Runs on poker sites
captureAndAnalyze() {
  // Find poker table element
  // Capture as image
  // Detect cards using CV
  // Send to solver
}

// Background Script - Manages state
analyzeHand(detection) {
  // Process detection
  // Run solver logic
  // Return recommendation
}
```

## 🛠️ Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/pselamy/poker-tab-analyzer.git
cd poker-tab-analyzer

# Set up Python environment
./setup.sh
source venv/bin/activate

# Install Chrome extension
cd chrome-extension
# Load in Chrome as unpacked extension

# (Optional) Set up native solver
cd ../native-host
./install.sh
```

### Testing

```bash
# Test detection algorithms
python test_generic_detection.py

# Test with examples
python examples.py

# Test Chrome extension
# Open chrome-extension/test-page.html in browser
```

## 📊 Performance

- **Fast Mode**: 10-50ms per frame (default)
- **Accurate Mode**: 100-200ms per frame
- **Chrome Extension**: Native performance
- **CPU Usage**: ~5-10% on modern hardware

## 🔐 Privacy & Security

- ✅ **100% Local**: No data leaves your computer
- ✅ **Open Source**: Inspect all code
- ✅ **No Screenshots Saved**: Only processes in memory
- ✅ **No Network Requests**: Works offline

## 📈 Roadmap

- [x] Generic computer vision detection
- [x] Chrome extension
- [x] Multi-platform support
- [ ] Advanced OCR for pot/stacks
- [ ] GTO solver integration
- [ ] Hand history tracking
- [ ] Multi-table support
- [ ] Mobile app

## 🤝 Contributing

Contributions welcome! Areas to help:

1. Test on your favorite poker site
2. Improve card detection accuracy
3. Add solver algorithms
4. Enhance performance
5. Create UI improvements

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## ⚠️ Disclaimer

This tool is for educational and analytical purposes. Always follow the terms of service of the poker sites you use. The authors are not responsible for any misuse of this software.

## 🔗 Links

- [Chrome Extension Guide](chrome-extension/README.md)
- [Migration from v1](MIGRATION.md)
- [Generic Detection Docs](README_GENERIC.md)
- [Examples](examples.py)

---

Made with ♠♥♦♣ by poker enthusiasts, for poker enthusiasts
