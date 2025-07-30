# Development Roadmap

## Phase 1: Core Infrastructure ✅
- [x] Create repository structure
- [x] Set up GitHub repository
- [x] Research poker solver libraries
- [x] Create basic project skeleton

## Phase 2: Screenshot Capture (Current)
- [ ] Implement Chrome tab detection
- [ ] Create screenshot capture with configurable intervals
- [ ] Add region-of-interest detection for poker table
- [ ] Test performance at 250ms intervals

## Phase 3: Card Detection
- [ ] Implement template matching for card detection
- [ ] Create card image dataset
- [ ] Add OCR fallback for difficult cases
- [ ] Handle different poker site layouts

## Phase 4: Solver Integration
- [ ] Integrate chosen poker solver (likely pokersolver for MVP)
- [ ] Create adapter interface for solver communication
- [ ] Implement hand history tracking
- [ ] Add pot odds and player count detection

## Phase 5: User Interface
- [ ] Create overlay for recommendations
- [ ] Add configuration GUI
- [ ] Implement hotkeys for manual triggers
- [ ] Add logging and statistics

## Phase 6: Testing & Optimization
- [ ] Create comprehensive test suite
- [ ] Optimize for real-time performance
- [ ] Add support for multiple poker sites
- [ ] Package for easy distribution

## Technical Decisions

### Screenshot Method
- **Option 1**: Selenium WebDriver (most reliable, but heavier)
- **Option 2**: PyAutoGUI (simple, but less precise)
- **Option 3**: Chrome Extension + Native Messaging (best performance)

### Card Detection
- **Primary**: OpenCV template matching
- **Fallback**: Tesseract OCR
- **Enhancement**: Train custom CNN for card detection

### Solver Choice
- **MVP**: pokersolver (JavaScript) via Node.js binding
- **Advanced**: wasm-postflop for GTO calculations
- **Future**: Custom solver implementation

## Next Immediate Steps
1. Set up development environment with virtual env
2. Implement basic Chrome screenshot capture
3. Create card template images
4. Build simple card detection prototype
