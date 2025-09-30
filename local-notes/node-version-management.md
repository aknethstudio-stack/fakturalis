# Node.js Version Management Guide

This document explains how to properly manage Node.js versions in the InvoiceForge project using nvm
and existing setup scripts.

## 🎯 Overview

InvoiceForge uses Node.js 22.x (LTS) as specified in `.nvmrc`. This guide helps ensure you're always
using the correct Node.js version for development.

## 📋 Current Configuration

- **Required Version**: Node.js 22.x (LTS)
- **Configuration File**: `.nvmrc` (contains `v22`)
- **Package Manager**: npm 10.x+ (comes with Node.js 22.x)

## 🔧 Setup Instructions

### 1. Install nvm (if not already installed)

#### Linux/macOS

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Restart terminal or run:
source ~/.bashrc  # or ~/.zshrc
```

#### Windows

Use nvm-windows: https://github.com/coreybutler/nvm-windows/releases

### 2. Install Node.js 22.x

```bash
# Install the latest LTS version 22.x
nvm install 22

# Or install specific version
nvm install 22.20.0
```

### 3. Verify Installation

```bash
nvm list
# Should show v22.x.x versions installed
```

## 🚀 Usage Methods

### Method 1: Manual Switching (Basic)

```bash
# In project directory
cd invoiceforge
nvm use
# Output: Found '.nvmrc' with version <v22>
# Output: Now using node v22.20.0 (npm v10.9.3)
```

### Method 2: Setup Scripts (Recommended)

```bash
# Linux/macOS - automatically switches to correct Node version
./scripts/setup.sh

# Windows PowerShell - automatically switches to correct Node version
.\scripts\setup.ps1

# Or via npm scripts
npm run setup           # Linux/macOS
npm run setup:windows   # Windows
```

### Method 3: Automatic Shell Integration (Pro)

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
# Auto-switch Node.js version when entering directories with .nvmrc
autoload -U add-zsh-hook
load-nvmrc() {
  local nvmrc_path="$(nvm_find_nvmrc)"
  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")
    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
      nvm use
    fi
  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

## 🔍 Troubleshooting

### Problem: "nvm: command not found"

**Cause**: nvm is not loaded in current shell session

**Solutions**:

```bash
# Option 1: Load nvm manually
source ~/.nvm/nvm.sh
nvm use

# Option 2: Use our script
./scripts/auto-nvm.sh

# Option 3: Restart terminal
```

### Problem: Node.js doesn't switch versions

**Cause**: Each terminal session needs nvm to be loaded

**Solutions**:

```bash
# Check current Node version
node --version

# Check if nvm is loaded
nvm --version

# Load nvm and switch
source ~/.nvm/nvm.sh && nvm use

# Or use our wrapper scripts
npm run nvm:dev
```

### Problem: Different Node.js version in different terminals

**Cause**: Each terminal has its own environment

**Solutions**:

1. Use `nvm use` in each new terminal
2. Set up automatic shell integration (Method 4 above)
3. Use our wrapper scripts for consistency

### Problem: IDE/Editor using wrong Node.js version

**Cause**: IDE may use system Node.js instead of nvm version

**Solutions**:

```bash
# Check which Node.js the system is using
which node

# Should show nvm path like:
# /home/user/.nvm/versions/node/v22.20.0/bin/node

# If not, switch versions:
nvm use 22

# For IDEs, you may need to restart after switching
```

## 📊 Version Verification Commands

```bash
# Check current versions
npm run node-version

# Detailed version info with our script
./scripts/npm-with-nvm.sh --version-info

# Manual check
node --version  # Should show v22.x.x
npm --version   # Should show v10.x.x
which node      # Should show nvm path
```

## 🎯 Best Practices

### Daily Development Workflow

```bash
# 1. Navigate to project
cd invoiceforge

# 2. Ensure correct Node.js version (choose one):
nvm use                           # Basic method
./scripts/setup.sh               # Full setup with version switch

# 3. Start development
npm run dev
```

### Team Collaboration

- Always commit changes with correct Node.js version
- Use `npm run check` to verify everything works
- Include Node.js version in bug reports
- Update `.nvmrc` when upgrading Node.js version

### CI/CD Considerations

```bash
# In CI environments, install specific version:
nvm install 22
nvm use 22

# Or use Node.js version managers in CI:
# GitHub Actions: actions/setup-node@v4
# GitLab CI: node:22-alpine docker image
```

## 🛠️ Available Scripts

| Script                  | Purpose                              | Usage              |
| ----------------------- | ------------------------------------ | ------------------ |
| `npm run setup`         | Full setup with correct Node version | Linux/macOS setup  |
| `npm run setup:windows` | Full setup with correct Node version | Windows setup      |
| `npm run node-version`  | Show current versions                | Verification       |
| `./scripts/setup.sh`    | Complete development setup           | Linux/macOS        |
| `./scripts/setup.ps1`   | Complete development setup           | Windows PowerShell |
| `./scripts/setup.bat`   | Complete development setup           | Windows CMD        |

## 📝 Environment Files

### .nvmrc

```
v22
```

### package.json engines

```json
{
  "engines": {
    "node": "22.x",
    "npm": ">=10.x"
  }
}
```

## 🔗 Resources

### Documentation

- [nvm GitHub Repository](https://github.com/nvm-sh/nvm)
- [Node.js Release Schedule](https://github.com/nodejs/release#release-schedule)
- [npm Version Compatibility](https://docs.npmjs.com/about-npm-versions)

### Tools

- [nvm for Windows](https://github.com/coreybutler/nvm-windows)
- [fnm (Fast Node Manager)](https://github.com/Schniz/fnm) - Alternative to nvm
- [Volta](https://volta.sh/) - Another Node.js version manager

## ⚠️ Important Notes

1. **Always use Node.js 22.x** for InvoiceForge development
2. **Different terminal sessions** may use different Node.js versions
3. **IDE/Editor** may need restart after switching Node.js versions
4. **Global npm packages** are version-specific (reinstall if needed)
5. **CI/CD environments** should use the same Node.js version

## 🎉 Summary

The InvoiceForge project is configured to use Node.js 22.x for optimal compatibility. Use the
provided scripts and workflows to ensure consistent development environment across all team members
and platforms.

For quick setup:

```bash
# Linux/macOS
cd invoiceforge
./scripts/setup.sh

# Windows PowerShell
cd invoiceforge
.\scripts\setup.ps1

# Windows Command Prompt
cd invoiceforge
scripts\setup.bat
```
