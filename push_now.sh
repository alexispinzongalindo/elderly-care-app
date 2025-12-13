#!/bin/bash

# Push script with token embedded
TOKEN="ghp_jDTQESKy4gn7BEORIogbo8jQt9JT0W02Dubs"
REPO="alexispinzongalindo/elderly-care-app"

cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

echo "🚀 Pushing to GitHub..."
echo ""

# Use git with the token in the URL
git push https://${TOKEN}@github.com/${REPO}.git main --force-with-lease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Check: https://github.com/${REPO}"
else
    echo ""
    echo "❌ Push failed. Check the error above."
fi















