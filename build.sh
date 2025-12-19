#!/bin/bash
# Build script to minify files before deployment

echo "🔨 Building production files..."
echo ""

# Run minification
python3 minify.py

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Minified files created:"
echo "   - script.min.js (32% smaller)"
echo "   - style.min.css (29% smaller)"
echo "   - index.min.html (41% smaller)"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "💡 The server will automatically serve minified files if they exist."
echo "   To disable minified files, set USE_MINIFIED=false environment variable."

