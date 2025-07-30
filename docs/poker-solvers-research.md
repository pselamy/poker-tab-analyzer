# Poker Solver Libraries Research

Based on GitHub search results, here are some notable poker solver libraries that could be integrated:

## Top Recommendations

### 1. **wasm-postflop** (496⭐)
- **URL**: https://github.com/b-inary/wasm-postflop
- **Language**: WebAssembly/Rust
- **Description**: Fast postflop solver that runs in the browser
- **Pros**: High performance, browser-compatible
- **Integration**: Could run directly in browser alongside our Chrome extension

### 2. **pokersolver** (408⭐)
- **URL**: https://github.com/goldfire/pokersolver
- **Language**: JavaScript
- **Description**: Texas Hold'em hand solver and comparison tool
- **Pros**: JavaScript native, easy integration
- **Use case**: Hand evaluation and comparison

### 3. **postflop-solver** (306⭐)
- **URL**: https://github.com/b-inary/postflop-solver
- **Language**: Rust
- **Description**: Fast GTO solver for postflop poker situations
- **Pros**: High performance, accurate GTO calculations

## Python-Specific Options

### 4. **Poker_CFR** (136⭐)
- **URL**: https://github.com/iciamyplant/Poker_CFR
- **Language**: Python
- **Description**: Counterfactual Regret Minimization (CFR) implementation
- **Pros**: Pure Python, good for understanding solver algorithms

## Integration Strategy

1. **For Quick Start**: Use `pokersolver` (JavaScript) for basic hand evaluation
2. **For Advanced GTO**: Integrate `wasm-postflop` for real-time solving
3. **For Python Backend**: Consider `Poker_CFR` or create Python bindings for Rust solvers

## Next Steps

1. Clone and test `pokersolver` for hand evaluation
2. Investigate `wasm-postflop` API for integration
3. Create adapter layer to interface with chosen solver
4. Benchmark performance with our 250ms capture interval
