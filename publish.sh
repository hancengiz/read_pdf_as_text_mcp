#!/bin/bash

# MCP Server Publish Script
# This script handles version bumping, testing, and npm publishing

set -e  # Exit on error

echo "🚀 MCP Server Publish Process"
echo "=============================="
echo ""

# Step 1: Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    git status -s
    exit 1
fi

# Step 2: Run tests
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Fix the issues before publishing."
    exit 1
fi
echo "✅ All tests passed!"
echo ""

# Step 3: Ask for version bump type
echo "📦 Current version: $(node -p "require('./package.json').version")"
echo ""
echo "Select version bump type:"
echo "  1) patch (1.0.0 -> 1.0.1) - Bug fixes"
echo "  2) minor (1.0.0 -> 1.1.0) - New features"
echo "  3) major (1.0.0 -> 2.0.0) - Breaking changes"
echo "  4) Skip version bump"
echo ""
read -p "Enter choice (1-4): " bump_choice

case $bump_choice in
    1)
        npm version patch --no-git-tag-version
        ;;
    2)
        npm version minor --no-git-tag-version
        ;;
    3)
        npm version major --no-git-tag-version
        ;;
    4)
        echo "Skipping version bump..."
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

NEW_VERSION=$(node -p "require('./package.json').version")
echo ""
echo "📌 New version: $NEW_VERSION"
echo ""

# Step 4: Commit version bump
if [ "$bump_choice" != "4" ]; then
    echo "💾 Committing version bump..."
    git add package.json package-lock.json
    git commit -m "Bump version to $NEW_VERSION"
    echo "✅ Version committed"
    echo ""
fi

# Step 5: Run tests again (in case package.json change affected anything)
echo "🧪 Running tests one more time..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed after version bump! Rolling back..."
    git reset --hard HEAD~1
    exit 1
fi
echo "✅ All tests passed!"
echo ""

# Step 6: Ask to publish
read -p "🚀 Publish v$NEW_VERSION to npm? (y/N): " publish_confirm
if [[ ! $publish_confirm =~ ^[Yy]$ ]]; then
    echo "❌ Publish cancelled. Version bump committed but not published."
    echo "   To publish later, run: npm publish"
    exit 0
fi

# Step 7: Publish to npm
echo "📦 Publishing to npm..."
npm publish
if [ $? -ne 0 ]; then
    echo "❌ Publish failed!"
    exit 1
fi
echo "✅ Published to npm!"
echo ""

# Step 8: Push to git
read -p "🔀 Push to git remote? (y/N): " git_push_confirm
if [[ $git_push_confirm =~ ^[Yy]$ ]]; then
    git push
    echo "✅ Pushed to git!"
else
    echo "⚠️  Remember to push: git push"
fi

echo ""
echo "🎉 Publish complete!"
echo "   Version: $NEW_VERSION"
echo "   Package: @fabriqa.ai/pdf-reader-mcp"
echo "   View: https://www.npmjs.com/package/@fabriqa.ai/pdf-reader-mcp"
