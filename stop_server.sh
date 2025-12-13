#!/bin/bash

echo "🛑 Stopping Flask server on port 5001..."

# Kill process on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Server stopped successfully"
else
    echo "ℹ️  No server was running on port 5001"
fi



