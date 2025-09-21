#!/bin/bash

# Setup script for Smart Photocopy Order Management System
# This script helps set up the development environment

set -e

echo "🚀 Setting up Smart Photocopy Order Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI detected"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install functions dependencies
echo "📦 Installing functions dependencies..."
cd functions
npm install
cd ..

# Create environment files if they don't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your Firebase configuration"
fi

if [ ! -f functions/.env ]; then
    echo "📝 Creating functions/.env from template..."
    cp functions/.env.example functions/.env
    echo "⚠️  Please edit functions/.env with your API keys"
fi

# Build functions
echo "🔨 Building Cloud Functions..."
cd functions
npm run build
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.local with your Firebase configuration"
echo "2. Edit functions/.env with your API keys (Shiprocket, WhatsApp)"
echo "3. Initialize Firebase project: firebase init"
echo "4. Seed the database: npm run seed"
echo "5. Start development: npm run dev"
echo ""
echo "🔗 Useful commands:"
echo "  npm run dev          - Start Next.js development server"
echo "  npm run build        - Build for production"
echo "  firebase emulators:start - Start Firebase emulators"
echo "  firebase deploy      - Deploy to production"
echo ""
echo "📚 Documentation: Check README.md for detailed setup instructions"
