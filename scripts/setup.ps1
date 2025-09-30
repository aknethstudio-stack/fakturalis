# InvoiceForge Setup Script for Windows PowerShell
# This script sets up the development environment on Windows

param(
    [switch]$SkipTests,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [string]$Prefix = ""
    )

    if ($Prefix) {
        Write-Host "[$Prefix] " -ForegroundColor $colors[$Color] -NoNewline
    }
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput -Message $Message -Color "Blue" -Prefix "INFO"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput -Message $Message -Color "Green" -Prefix "SUCCESS"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput -Message $Message -Color "Yellow" -Prefix "WARNING"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput -Message $Message -Color "Red" -Prefix "ERROR"
}

function Test-CommandExists {
    param([string]$Command)

    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-NodeVersion {
    param([string]$Version)

    if ($Version -match '^v?(\d+)\.') {
        $majorVersion = [int]$matches[1]
        return $majorVersion -eq 22
    }
    return $false
}

# Main setup process
try {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor White
    Write-Host "  InvoiceForge Development Setup" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor White
    Write-Host ""

    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    Write-Info "PowerShell version: $psVersion"

    if ($psVersion.Major -lt 5) {
        Write-Warning "PowerShell 5.0+ recommended for best compatibility"
    }

    # Check if Node.js is installed
    if (-not (Test-CommandExists "node")) {
        Write-Error "Node.js is not installed or not in PATH"
        Write-Host ""
        Write-Host "Please install Node.js 22.x:" -ForegroundColor Yellow
        Write-Host "Option 1: Download from https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "Option 2: Use nvm-windows:" -ForegroundColor Yellow
        Write-Host "  https://github.com/coreybutler/nvm-windows" -ForegroundColor Yellow
        Write-Host "  nvm install 22.0.0" -ForegroundColor Yellow
        Write-Host "  nvm use 22.0.0" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Check Node.js version
    $nodeVersion = & node --version
    Write-Info "Node.js version: $nodeVersion"

    if (-not (Test-NodeVersion $nodeVersion)) {
        Write-Warning "Recommended Node.js version is 22.x, you have $nodeVersion"
        Write-Info "Consider switching: nvm use 22"
    }

    # Check if npm is available
    if (-not (Test-CommandExists "npm")) {
        Write-Error "npm is not installed or not in PATH"
        Read-Host "Press Enter to exit"
        exit 1
    }

    $npmVersion = & npm --version
    Write-Info "npm version: $npmVersion"

    # Check if Git is installed
    if (-not (Test-CommandExists "git")) {
        Write-Error "Git is not installed or not in PATH"
        Write-Info "Please install Git from https://git-scm.com/"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    $gitVersion = & git --version
    Write-Info "$gitVersion"

    # Set Git configuration for line endings (recommended for Windows)
    Write-Info "Configuring Git for cross-platform compatibility..."
    try {
        & git config core.autocrlf input
        & git config core.eol lf
        Write-Info "Git line ending configuration updated"
    }
    catch {
        Write-Warning "Could not configure Git line endings"
    }

    Write-Host ""
    Write-Info "Installing dependencies..."

    if ($Verbose) {
        & npm install --verbose
    }
    else {
        & npm install
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
    Write-Info "Setting up Git hooks..."
    & npm run prepare
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to setup Git hooks"
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
    Write-Info "Running TypeScript type check..."
    & npm run type-check
    if ($LASTEXITCODE -ne 0) {
        Write-Error "TypeScript type check failed"
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
    Write-Info "Running ESLint..."
    & npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ESLint check failed"
        Read-Host "Press Enter to exit"
        exit 1
    }

    if (-not $SkipTests) {
        Write-Host ""
        Write-Info "Running tests..."
        & npm run test:ci
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Tests failed"
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
    else {
        Write-Info "Skipping tests (--SkipTests flag provided)"
    }

    # Create .env.local from .env.example if it doesn't exist
    if (-not (Test-Path ".env.local")) {
        if (Test-Path ".env.example") {
            Write-Host ""
            Write-Info "Creating .env.local from .env.example..."
            Copy-Item ".env.example" ".env.local"
            Write-Info "Please edit .env.local with your configuration"
        }
    }

    # Check Windows version for long path support
    $windowsVersion = [System.Environment]::OSVersion.Version
    if ($windowsVersion.Major -ge 10) {
        Write-Info "Windows 10+ detected - long paths should be supported"
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Success "Setup completed successfully!"
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Edit .env.local with your configuration" -ForegroundColor White
    Write-Host "2. Run: npm run dev" -ForegroundColor White
    Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
    Write-Host ""

    Write-Host "Available commands:" -ForegroundColor Yellow
    Write-Host "  npm run dev          - Start development server" -ForegroundColor White
    Write-Host "  npm run build        - Build for production" -ForegroundColor White
    Write-Host "  npm run test         - Run tests" -ForegroundColor White
    Write-Host "  npm run lint         - Check code quality" -ForegroundColor White
    Write-Host "  npm run format       - Format code" -ForegroundColor White
    Write-Host "  npm run check        - Run all quality checks" -ForegroundColor White
    Write-Host ""

    Write-Host "PowerShell specific options:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup.ps1 -SkipTests    - Skip running tests" -ForegroundColor White
    Write-Host "  .\scripts\setup.ps1 -Verbose      - Verbose npm output" -ForegroundColor White
    Write-Host ""

    Write-Success "Happy coding! 🚀"
    Write-Host ""

}
catch {
    Write-Host ""
    Write-Error "Setup failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $_.Exception.ToString() -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Keep window open if running interactively
if ($Host.Name -eq "ConsoleHost") {
    Read-Host "Press Enter to continue"
}
