#!/bin/bash

# Fakturalis Setup Script for Unix/Linux/macOS
# This script sets up the development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed or not in PATH"
        return 1
    fi
    return 0
}

echo
echo "========================================"
echo "  Fakturalis Development Setup"
echo "========================================"
echo

# Check if Node.js is installed
if ! check_command node; then
    log_error "Please install Node.js 22.x"
    log_info "Recommended: Use nvm (https://github.com/nvm-sh/nvm)"
    log_info "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    log_info "  nvm install 22"
    log_info "  nvm use 22"
    exit 1
fi

NODE_VERSION=$(node --version)
log_info "Node.js version: $NODE_VERSION"

# Check Node.js version (basic check for v22)
if [[ ! "$NODE_VERSION" =~ ^v22\. ]]; then
    log_warning "Recommended Node.js version is 22.x, you have $NODE_VERSION"
    log_info "Consider using: nvm use 22"
fi

# Check if npm is available
if ! check_command npm; then
    log_error "npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_info "npm version: $NPM_VERSION"

# Check if Git is installed
if ! check_command git; then
    log_error "Git is not installed"
    log_info "Please install Git: https://git-scm.com/"
    exit 1
fi

GIT_VERSION=$(git --version)
log_info "$GIT_VERSION"

echo
log_info "Installing dependencies..."
if ! npm install; then
    log_error "Failed to install dependencies"
    exit 1
fi

echo
log_info "Setting up Git hooks..."
if ! npm run prepare; then
    log_error "Failed to setup Git hooks"
    exit 1
fi

echo
log_info "Running type check..."
if ! npm run type-check; then
    log_error "TypeScript type check failed"
    exit 1
fi

echo
log_info "Running linter..."
if ! npm run lint; then
    log_error "ESLint check failed"
    exit 1
fi

echo
log_info "Running tests..."
if ! npm run test:ci; then
    log_error "Tests failed"
    exit 1
fi

# Create .env.local from .env.example if it doesn't exist
if [[ ! -f ".env.local" ]]; then
    if [[ -f ".env.example" ]]; then
        echo
        log_info "Creating .env.local from .env.example..."
        cp ".env.example" ".env.local"
        log_info "Please edit .env.local with your configuration"
    fi
fi

# Make scripts executable
if [[ -d "scripts" ]]; then
    log_info "Making scripts executable..."
    chmod +x scripts/*.sh 2>/dev/null || true
fi

echo
echo "========================================"
log_success "Setup completed successfully!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo
echo "Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run test         - Run tests"
echo "  npm run lint         - Check code quality"
echo "  npm run format       - Format code"
echo "  npm run check        - Run all quality checks"
echo

log_success "Happy coding! 🚀"
