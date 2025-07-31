#!/bin/bash

# Simple build script for Chrome extension

echo "Building Poker Tab Analyzer..."

# Compile TypeScript
npx tsc

# Create extension directory
mkdir -p dist/extension

# Copy extension files
cp extension/manifest.json dist/extension/
cp extension/*.html dist/extension/
cp extension/*.css dist/extension/

# Copy compiled JS (skip if already in dist/extension)
if [ ! -f dist/extension/background.js ]; then
  cp dist/extension/*.js dist/extension/ 2>/dev/null || true
fi
cp -r dist/lib dist/extension/

# Create icons
mkdir -p dist/extension/icons
echo "Creating placeholder icons..."
convert -size 16x16 xc:#2196f3 dist/extension/icon16.png 2>/dev/null || echo "⚠️  Install ImageMagick for icons"
convert -size 48x48 xc:#2196f3 dist/extension/icon48.png 2>/dev/null || echo ""
convert -size 128x128 xc:#2196f3 dist/extension/icon128.png 2>/dev/null || echo ""

# Create zip file
cd dist/extension
zip -r ../poker-tab-analyzer.zip *
cd ../..

echo "✅ Build complete! Extension at: dist/poker-tab-analyzer.zip"
echo "📁 Load unpacked from: dist/extension/"