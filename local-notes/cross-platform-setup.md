# Cross-Platform Setup Guide

This document provides setup instructions for InvoiceForge on different operating systems and
editors.

## 📋 Prerequisites

### All Platforms

- **Node.js**: 22.x (recommended via nvm/nvm-windows)
- **npm**: >=10.x (comes with Node.js)
- **Git**: Latest version

### Version Managers

- **Linux/macOS**: [nvm](https://github.com/nvm-sh/nvm)
- **Windows**: [nvm-windows](https://github.com/coreybutler/nvm-windows)

## 🐧 Linux Setup

### 1. Install Dependencies

```bash
# Install Node.js via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Verify versions
node --version  # should be 22.x
npm --version   # should be >=10.x
```

### 2. Clone and Setup Project

```bash
git clone <repository-url>
cd invoiceforge
npm run setup
```

### 3. Development

```bash
npm run dev          # Start development server
npm run test:watch   # Run tests in watch mode
```

## 🪟 Windows 11 Setup

### Option A: Using PowerShell (Recommended)

1. **Install Node.js via nvm-windows**

```powershell
# Install nvm-windows first: https://github.com/coreybutler/nvm-windows/releases
# Then in PowerShell as Administrator:
nvm install 22.0.0
nvm use 22.0.0

# Verify
node --version
npm --version
```

2. **Clone Project**

```powershell
git clone <repository-url>
cd invoiceforge
npm run setup
```

### Option B: Using Git Bash

```bash
# Same commands as Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Restart Git Bash, then:
nvm install 22
nvm use 22

git clone <repository-url>
cd invoiceforge
npm run setup
```

### Windows-Specific Notes

- Line endings are automatically handled by `.gitattributes`
- PowerShell, Command Prompt, and Git Bash are all supported
- VS Code terminal integration works out of the box

## 🍎 macOS Setup

### 1. Install Dependencies

```bash
# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc  # or ~/.bash_profile
nvm install 22
nvm use 22
```

### 2. Setup Project

```bash
git clone <repository-url>
cd invoiceforge
npm run setup
```

## 🎨 Editor Configuration

### VS Code

The project includes complete VS Code configuration:

- `.vscode/settings.json` - Editor settings, formatters, linters
- `.vscode/extensions.json` - Recommended extensions

**Recommended Extensions:**

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer
- GitLens

### Zed Editor

Configuration is provided in `.zed/settings.json`:

- Tailwind CSS support
- ESLint integration
- TypeScript language server
- Prettier formatting

### Other Editors

The project uses `.editorconfig` for consistent formatting across all editors:

- 2-space indentation
- LF line endings
- UTF-8 encoding
- Trim trailing whitespace

## 🛠️ Available Scripts

### Development

```bash
npm run dev          # Start dev server
npm run dev:turbo    # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format with Prettier
npm run format:check # Check Prettier formatting
npm run stylelint    # Run Stylelint
npm run stylelint:fix # Fix Stylelint errors
npm run type-check   # TypeScript type checking
npm run check        # Run all checks (lint + type + test)
```

### Testing

```bash
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:ci      # Run tests for CI (no watch)
```

### Cleanup

```bash
npm run clean        # Clean build artifacts
npm run clean:node   # Remove node_modules
npm run clean:all    # Clean everything
```

### Release

```bash
npm run release      # Create release with changelog
npm run release:patch # Patch version release
npm run release:minor # Minor version release
npm run release:major # Major version release
```

## 🔧 Environment Configuration

### 1. Environment Variables

Copy the example environment file:

```bash
# All platforms
cp .env.example .env.local
```

Edit `.env.local` with your configuration.

### 2. Git Configuration

The project handles line endings automatically, but you can ensure consistency:

```bash
# Global Git config (recommended for Windows)
git config --global core.autocrlf input
git config --global core.eol lf

# Project-specific (optional)
git config core.autocrlf input
git config core.eol lf
```

## 🚀 Quick Start Commands

### First Time Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd invoiceforge

# 2. Setup everything
npm run setup

# 3. Create environment file
cp .env.example .env.local

# 4. Start development
npm run dev
```

### Daily Development

```bash
# Start development server
npm run dev

# In another terminal: run tests
npm run test:watch

# Before committing
npm run check
```

## 🐛 Troubleshooting

### Common Issues

#### Node Version Mismatch

```bash
# Check current version
node --version

# Switch to project version
nvm use 22
```

#### Permission Issues (Windows)

Run PowerShell/Command Prompt as Administrator for npm global installs.

#### Line Ending Issues

The project uses `.gitattributes` to handle this automatically, but if you encounter issues:

```bash
# Re-normalize line endings
git add --renormalize .
git commit -m "Normalize line endings"
```

#### Husky Hooks Not Working

```bash
# Reinstall hooks
npm run prepare
```

#### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf tsconfig.tsbuildinfo
npm run type-check
```

#### Build Failures

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Platform-Specific Issues

#### Windows: Long Path Issues

Enable long paths in Windows:

```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

#### macOS: Permission Denied

Fix npm permissions:

```bash
sudo chown -R $(whoami) ~/.npm
```

## 🔒 Security Notes

### Windows Defenders/Antivirus

Add project folder to exclusions list for better performance:

- `node_modules/`
- `.next/`
- `build/`
- `.turbo/`

### File Permissions

The project includes security settings in VS Code configuration to prompt for untrusted files.

## 📦 Project Structure

```
invoiceforge/
├── .vscode/          # VS Code configuration
├── .zed/             # Zed editor configuration
├── .husky/           # Git hooks
├── __tests__/        # Test files
├── local-notes/      # Development documentation
├── public/           # Static assets
├── src/              # Source code
│   ├── app/          # Next.js app router
│   ├── components/   # React components
│   ├── lib/          # Utility functions
│   └── styles/       # Global styles
├── .editorconfig     # Editor configuration
├── .gitattributes    # Git line ending configuration
├── package.json      # Dependencies and scripts
└── README.md         # Project documentation
```

## 🤝 Contributing

Before contributing, ensure your environment is properly set up:

1. Run all checks: `npm run check`
2. Tests pass: `npm test`
3. No linting errors: `npm run lint`
4. Proper formatting: `npm run format:check`

The project uses:

- **Husky** for pre-commit hooks
- **lint-staged** for staged file linting
- **Conventional Commits** for commit messages
- **Standard Version** for automated releases

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring)
