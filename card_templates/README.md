# Card Templates

This directory contains template images for card detection on different poker platforms.

## Directory Structure

```
card_templates/
├── global_poker/
│   ├── ranks/
│   │   ├── 2.png
│   │   ├── 3.png
│   │   ├── ...
│   │   ├── K.png
│   │   └── A.png
│   ├── suits/
│   │   ├── clubs.png
│   │   ├── diamonds.png
│   │   ├── hearts.png
│   │   └── spades.png
│   └── full_cards/  (optional)
│       ├── 2c.png
│       ├── 2d.png
│       └── ...
└── [other_platforms]/
```

## Creating Templates

### For Global Poker:

1. **Take Screenshots**: Capture clear screenshots of each rank and suit from Global Poker
2. **Crop Images**: 
   - Ranks: Crop just the rank symbol (2, 3, ..., K, A)
   - Suits: Crop just the suit symbol
   - Keep consistent dimensions
3. **Save Format**: PNG with transparent background preferred
4. **Naming Convention**:
   - Ranks: `2.png`, `3.png`, ..., `10.png`, `J.png`, `Q.png`, `K.png`, `A.png`
   - Suits: `clubs.png`, `diamonds.png`, `hearts.png`, `spades.png`

### Template Requirements:

- **Resolution**: High quality, at least 50x50 pixels
- **Background**: Transparent or consistent color
- **Orientation**: Upright, not rotated
- **Consistency**: All templates from same card design/theme

## Usage

These templates are used by the card detection module for template matching. The detector will:

1. Load templates on initialization
2. Use OpenCV template matching to find cards
3. Fall back to OCR if template matching fails

## Adding New Platforms

To add templates for a new platform:

1. Create directory: `card_templates/[platform_name]/`
2. Add ranks and suits subdirectories
3. Follow same naming conventions
4. Update platform detector to use new templates
