# Poker Tab Analyzer

A real-time poker assistant that captures screenshots of your Chrome browser tab, identifies Texas Hold'em cards, and provides optimal playing strategies using poker solver algorithms.

## Features

- **Automatic Screenshot Capture**: Takes screenshots of the active Chrome tab every 250ms (configurable)
- **Card Recognition**: Uses computer vision to identify your hole cards and community cards
- **Strategy Analysis**: Integrates with poker solver algorithms to recommend optimal plays
- **Chip Stack Awareness**: Considers player count and chip stacks in its recommendations

## Requirements

- Python 3.8+
- Chrome browser
- OpenCV for image processing
- Poker solver library (TBD)

## Installation

```bash
# Clone the repository
git clone https://github.com/pselamy/poker-tab-analyzer.git
cd poker-tab-analyzer

# Install dependencies
pip install -r requirements.txt
```

## Usage

```bash
python main.py
```

## Configuration

Edit `config.json` to adjust:
- Screenshot interval (default: 250ms)
- Detection sensitivity
- Solver parameters

## License

MIT License
