#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting SafeStride build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Check if public directory exists
echo "🔍 Checking public directory..."
ls -la public/

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Copy build to backend
echo "📋 Copying build to backend..."
cp -r build ../backend/public

echo "✅ Build completed successfully!" 