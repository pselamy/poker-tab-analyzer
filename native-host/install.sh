#!/bin/bash
# Install native messaging host for Chrome

echo "Installing Poker Analyzer Native Host..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Chrome native messaging hosts location
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    HOST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    HOST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

# Create directory if it doesn't exist
mkdir -p "$HOST_DIR"

# Copy manifest
cp "$DIR/manifest.json" "$HOST_DIR/com.pokeranalyzer.solver.json"

# Update path in manifest
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sed -i "s|/home/pselamy|$HOME|g" "$HOST_DIR/com.pokeranalyzer.solver.json"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|/home/pselamy|$HOME|g" "$HOST_DIR/com.pokeranalyzer.solver.json"
fi

# Make host executable
chmod +x "$DIR/poker_host.py"

echo "Native host installed successfully!"
echo ""
echo "Next steps:"
echo "1. Load the Chrome extension in developer mode"
echo "2. Copy the extension ID from chrome://extensions"
echo "3. Update the extension ID in: $HOST_DIR/com.pokeranalyzer.solver.json"
echo "4. Reload the extension"
