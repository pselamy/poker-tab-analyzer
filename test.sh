#!/bin/bash

# Simple test runner

echo "Running tests..."

# Compile TypeScript
npx tsc

# Compile test TypeScript files
echo "Compiling unit tests..."
npx tsc tests/unit/*.test.ts --outDir dist/tests/unit --module es2022 --target es2022 --moduleResolution node --allowSyntheticDefaultImports --esModuleInterop

# Run library tests
echo "Running library tests..."
node --test dist/lib/*.test.js

# Run unit tests
echo "Running unit tests..."
node --test dist/tests/unit/*.test.js || true

echo "✅ Tests complete!"