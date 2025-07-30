# Supported Poker Platforms

## Currently Planned Support

### Global Poker
- **Priority**: HIGH (requested feature)
- **URL**: https://globalpoker.com
- **Table Detection**: Need to identify table layout and card positions
- **Challenges**: 
  - Sweepstakes model (Gold Coins/Sweeps Cash)
  - Dynamic table resizing
  - Card animations during dealing
- **Implementation Notes**:
  - Will need custom template matching for GP card designs
  - Must handle both tournament and cash game layouts
  - Special handling for all-in situations and side pots

### PokerStars
- **Priority**: Medium
- **Status**: Planned
- **Notes**: Most popular platform, well-documented layout

### GGPoker  
- **Priority**: Medium
- **Status**: Planned
- **Notes**: Growing platform, unique UI elements

### Americas Cardroom
- **Priority**: Low
- **Status**: Future consideration

## Platform Detection Strategy

1. **URL Detection**: Check browser tab URL for platform identification
2. **Visual Markers**: Identify platform-specific UI elements
3. **Configuration**: Allow manual platform selection in config

## Global Poker Specific Requirements

### Table Elements to Detect
- Player seats (up to 9 players)
- Hole cards position
- Community cards area
- Pot size display
- Player chip stacks
- Action buttons (fold, check, call, raise)
- Dealer button position

### Technical Considerations
- Gold Coins (GC) vs Sweeps Cash (SC) detection
- Tournament vs Cash game UI differences
- Multi-table support
- Time bank detection

### Card Design Templates
Global Poker uses specific card designs that need to be captured:
- Standard deck with custom backing
- Clear rank/suit display
- Animation states (dealing, folding)
