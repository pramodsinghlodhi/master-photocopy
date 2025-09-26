#!/bin/bash

# Enhanced Setup Script for Master PhotoCopy - Smart Photocopy Order Management System
# This script provides a complete installation and configuration experience

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

print_step() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get user input
get_user_input() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    
    if [ -n "$default_value" ]; then
        read -p "$prompt [$default_value]: " input
        eval "$var_name=\"${input:-$default_value}\""
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Function to validate Firebase config
validate_firebase_config() {
    if [[ -z "$FIREBASE_API_KEY" || -z "$FIREBASE_PROJECT_ID" || -z "$FIREBASE_AUTH_DOMAIN" ]]; then
        print_error "Firebase configuration is incomplete"
        return 1
    fi
    return 0
}

# Main setup function
main() {
    clear
    print_header "🚀 Masterphoto Copy - Smart Photocopy Order Management System"
    print_header "=================================================================="
    echo ""
    print_info "This script will help you set up your complete printing management system"
    echo ""

    # Step 1: System Requirements Check
    print_step "Step 1: Checking System Requirements..."
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_status "Node.js $(node -v) detected"
        else
            print_error "Node.js version 18+ is required. Current version: $(node -v)"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        print_info "Visit: https://nodejs.org/"
        exit 1
    fi

    # Check npm
    if command_exists npm; then
        print_status "npm $(npm -v) detected"
    else
        print_error "npm is not installed"
        exit 1
    fi

    # Check Git
    if command_exists git; then
        print_status "Git detected"
    else
        print_warning "Git is not installed. Some features may not work."
    fi

    echo ""

    # Step 2: Firebase CLI Installation
    print_step "Step 2: Firebase CLI Setup..."
    
    if command_exists firebase; then
        print_status "Firebase CLI detected"
    else
        print_info "Installing Firebase CLI..."
        npm install -g firebase-tools
        print_status "Firebase CLI installed"
    fi

    echo ""

    # Step 3: Project Dependencies
    print_step "Step 3: Installing Project Dependencies..."
    
    print_info "Installing root dependencies..."
    npm install
    print_status "Root dependencies installed"

    if [ -d "functions" ]; then
        print_info "Installing Cloud Functions dependencies..."
        cd functions
        npm install
        cd ..
        print_status "Functions dependencies installed"
    fi

    echo ""

    # Step 4: Environment Configuration
    print_step "Step 4: Environment Configuration..."
    
    # Ask user for configuration type
    echo "Choose your setup type:"
    echo "1) Development (with Firebase Emulators)"
    echo "2) Production (with real Firebase project)"
    echo "3) Custom configuration"
    echo ""
    
    get_user_input "Enter your choice (1-3)" SETUP_TYPE "1"
    
    case $SETUP_TYPE in
        1)
            print_info "Setting up development environment with Firebase Emulators..."
            create_dev_environment
            ;;
        2)
            print_info "Setting up production environment..."
            create_prod_environment
            ;;
        3)
            print_info "Setting up custom environment..."
            create_custom_environment
            ;;
        *)
            print_warning "Invalid choice. Using development setup..."
            create_dev_environment
            ;;
    esac

    echo ""

    # Step 5: Firebase Project Setup
    print_step "Step 5: Firebase Project Setup..."
    
    if [ "$SETUP_TYPE" != "1" ]; then
        setup_firebase_project
    else
        print_info "Using Firebase Emulators for development"
    fi

    echo ""

    # Step 6: Build and Test
    print_step "Step 6: Building and Testing..."
    
    print_info "Building Cloud Functions..."
    if [ -d "functions" ]; then
        cd functions
        npm run build
        cd ..
        print_status "Functions built successfully"
    fi

    print_info "Type checking..."
    npm run typecheck
    print_status "Type checking passed"

    echo ""

    # Step 7: Database Setup Complete
    print_step "Step 7: Database Setup Complete..."

    echo ""

    # Step 8: Final Setup
    print_step "Step 8: Final Configuration..."
    
    create_useful_scripts
    print_status "Setup scripts created"

    echo ""
    print_header "🎉 Installation Complete!"
    print_header "========================"
    echo ""
    print_info "Your Masterphoto Copy application is ready!"
    echo ""
    print_info "Quick Start Commands:"
    echo "  npm run dev          - Start development server (port 9002)"
    echo "  npm run emulators    - Start Firebase emulators"
    echo "  npm run build        - Build for production"
    echo "  firebase deploy      - Deploy to production"
    echo ""
    print_info "📞 IMMEDIATE ACCESS"
    echo "Since your application is currently running:"
    echo "  🏠 Main Application: https://master-photocopy--master-photocopy.us-central1.hosted.app"
    echo "  �️ Installation Guide: https://master-photocopy--master-photocopy.us-central1.hosted.app/install"
    echo "  ⚙️ Configuration: https://master-photocopy--master-photocopy.us-central1.hosted.app/config"
    echo "  👨‍💼 Admin Panel: https://master-photocopy--master-photocopy.us-central1.hosted.app/admin"
    echo "  ❤️ Health Check: https://master-photocopy--master-photocopy.us-central1.hosted.app/api/health"
    echo ""
    print_warning "Local Development (optional):"
    echo "  1. Start the development server: npm run dev"
    echo "  2. Visit http://localhost:9002 for local development"
    echo "  3. Run Firebase emulators: npm run emulators"
    echo "  4. Use local Firebase UI: http://localhost:4000"
    echo ""
}

# Function to create development environment
create_dev_environment() {
    cat > .env.local << EOF
# Development Environment Configuration
# Generated by setup script on $(date)

# Firebase Configuration for Emulator
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-masterphotocopy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-masterphotocopy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-masterphotocopy.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Application Configuration
NEXT_PUBLIC_APP_URL=https://master-photocopy--master-photocopy.us-central1.hosted.app
NEXT_PUBLIC_APP_NAME="Masterphoto Copy"

# Emulator Configuration
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT=8080
NEXT_PUBLIC_AUTH_EMULATOR_PORT=9099
NEXT_PUBLIC_STORAGE_EMULATOR_PORT=9199

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MODE=true

# Optional: WhatsApp API Configuration (for testing)
WHATSAPP_API_TOKEN=test_token
WHATSAPP_VERIFY_TOKEN=test_verify_token

# Optional: Payment Configuration (for testing)
RAZORPAY_KEY_ID=test_key_id
RAZORPAY_KEY_SECRET=test_key_secret
EOF

    print_status "Development environment created (.env.local)"
}

# Function to create production environment
create_prod_environment() {
    print_info "Please provide your Firebase project configuration:"
    echo ""
    
    get_user_input "Firebase Project ID" FIREBASE_PROJECT_ID
    get_user_input "Firebase API Key" FIREBASE_API_KEY
    get_user_input "Firebase Auth Domain" FIREBASE_AUTH_DOMAIN "$FIREBASE_PROJECT_ID.firebaseapp.com"
    get_user_input "Firebase Storage Bucket" FIREBASE_STORAGE_BUCKET "$FIREBASE_PROJECT_ID.appspot.com"
    get_user_input "Firebase Messaging Sender ID" FIREBASE_MESSAGING_SENDER_ID
    get_user_input "Firebase App ID" FIREBASE_APP_ID
    
    if validate_firebase_config; then
        cat > .env.local << EOF
# Production Environment Configuration
# Generated by setup script on $(date)

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME="Masterphoto Copy"

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false

# API Configuration (Please configure these)
WHATSAPP_API_TOKEN=your_whatsapp_api_token
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EOF

        print_status "Production environment created (.env.local)"
        print_warning "Please update the API tokens in .env.local before deploying"
    else
        print_error "Failed to create production environment"
        exit 1
    fi
}

# Function to create custom environment
create_custom_environment() {
    if [ ! -f .env.example ]; then
        print_error ".env.example not found"
        exit 1
    fi
    
    cp .env.example .env.local
    print_status "Environment template copied to .env.local"
    print_info "Please edit .env.local with your configuration"
}

# Function to setup Firebase project
setup_firebase_project() {
    read -p "Do you want to initialize a new Firebase project? (y/N): " INIT_FIREBASE
    if [[ $INIT_FIREBASE =~ ^[Yy]$ ]]; then
        print_info "Initializing Firebase project..."
        firebase login
        firebase init
        print_status "Firebase project initialized"
    fi
}

# Function to create useful scripts
create_useful_scripts() {
    # Create a start script
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Masterphoto Copy Development Environment..."

# Start Firebase emulators in background
echo "📊 Starting Firebase emulators..."
npm run emulators &
EMULATOR_PID=$!

# Wait for emulators to start
sleep 5

# Start Next.js development server
echo "🌐 Starting Next.js development server..."
npm run dev

# Cleanup
kill $EMULATOR_PID 2>/dev/null
EOF
    chmod +x start.sh

    # Create a deploy script
    cat > deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying Masterphoto Copy to Production..."

# Type check
echo "🔍 Type checking..."
npm run typecheck

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
EOF
    chmod +x deploy.sh

    # Create a test script
    cat > test-setup.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Masterphoto Copy Setup..."

# Check if all services are running
echo "🔍 Checking services..."

# Check Next.js
if curl -s http://localhost:9002 > /dev/null; then
    echo "✅ Next.js server is running"
else
    echo "❌ Next.js server is not running"
fi

# Check Firebase emulators
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Firebase emulators are running"
else
    echo "❌ Firebase emulators are not running"
fi

echo "🧪 Setup test complete!"
EOF
    chmod +x test-setup.sh
}

# Run main function
main "$@"
