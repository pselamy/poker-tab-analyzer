#!/bin/bash

# Simple test runner

echo "Running tests..."

# Compile tests
npx tsc

# Run tests with Node.js built-in test runner
node --test dist/**/*_test.js

echo "✅ Tests complete!"