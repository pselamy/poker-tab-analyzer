#!/bin/bash

# Simple test runner

echo "Running tests..."

# Compile TypeScript
npx tsc

# Run tests with Node.js
node --test dist/lib/*.test.js

echo "✅ Tests complete!"