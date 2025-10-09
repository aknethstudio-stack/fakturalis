# Cross-Platform Setup

Quick setup guide for Fakturalis on different platforms.

## Prerequisites

- **Node.js**: 22.x (via nvm, nvm-windows, volta, or fnm)
- **npm**: >=10.x
- **Git**: Latest version

## Quick Setup

### Linux/macOS

```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # or ~/.zshrc
nvm install 22 && nvm use 22

# Setup project
git clone <repo-url>
cd fakturalis && npm run setup
```

### Windows

```powershell
# Option 1: nvm-windows
nvm install 22.0.0 && nvm use 22.0.0

# Option 2: Volta (recommended)
volta install node@22

# Option 3: fnm
fnm install 22 && fnm use 22

# Setup project
git clone <repo-url>
cd fakturalis && npm run setup
```

## Editor Support

- **VS Code**: Complete configuration in `.vscode/`
- **Zed**: Configuration in `.zed/settings.json`
- **Others**: EditorConfig for consistent formatting

## Development Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run tests
npm run check        # All quality checks
```

## Troubleshooting

### Node Version Issues

```bash
node --version       # Check version

# Switch version (choose your tool):
nvm use 22          # nvm/nvm-windows
volta pin node@22   # Volta
fnm use 22          # fnm
```

### Build Issues

```bash
npm run clean       # Clean build cache
npm ci              # Fresh install
```

### Git Line Endings

Handled automatically by `.gitattributes` - no action needed.

## Project Structure

```text
fakturalis/
├── src/              # Source code
├── docs/             # Technical documentation
├── local-notes/      # Private workspace notes
├── scripts/          # Setup scripts
└── .vscode/          # Editor configuration
```
