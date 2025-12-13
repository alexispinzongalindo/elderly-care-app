#!/bin/bash

# Helper script to push to GitHub with token

echo "🚀 GitHub Push Helper"
echo "===================="
echo ""
echo "Please paste your Personal Access Token:"
echo "(It starts with 'ghp_' and you can get it from: https://github.com/settings/tokens)"
echo ""
read -s TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo ""
echo "📤 Pushing to GitHub..."
echo ""

cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

git push https://${TOKEN}@github.com/alexispinzongalindo/elderly-care-app.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Check your repository: https://github.com/alexispinzongalindo/elderly-care-app"
else
    echo ""
    echo "❌ Push failed. Please check your token and try again."
fi

















