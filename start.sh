#!/bin/bash

# Simple launcher - works from anywhere
# This script finds the project folder and starts the server

PROJECT_PATH="/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

# Check if project exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ Error: Project folder not found at:"
    echo "   $PROJECT_PATH"
    echo ""
    echo "Please update the PROJECT_PATH in this script to match your new location."
    exit 1
fi

# Navigate to project and run the start script
cd "$PROJECT_PATH" || exit 1
./start_server_background.sh

