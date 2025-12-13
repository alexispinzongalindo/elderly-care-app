#!/bin/bash

# Change to the project directory
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

# Kill any existing server on port 5001
echo "🔄 Checking for existing server on port 5001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
sleep 1

# Start the Flask server
echo "🚀 Starting Flask server on port 5001..."
echo "📍 Server will be available at: http://127.0.0.1:5001"
echo "📍 Or use your local IP address"
echo ""
echo "⚠️  Keep this terminal window open while using the app"
echo "⚠️  Press Ctrl+C to stop the server"
echo ""
python3 server.py
