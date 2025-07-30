#!/bin/bash
# Setup script for Poker Tab Analyzer development environment

echo "Setting up Poker Tab Analyzer development environment..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Create config from example if it doesn't exist
if [ ! -f "config.json" ]; then
    echo "Creating config.json from example..."
    cp config.example.json config.json
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p screenshots
mkdir -p logs
mkdir -p card_templates

echo ""
echo "Setup complete! To start developing:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the analyzer: python main.py"
echo ""
echo "Repository: https://github.com/pselamy/poker-tab-analyzer"
