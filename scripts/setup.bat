@echo off
setlocal enabledelayedexpansion

:: InvoiceForge Setup Script for Windows
:: This script sets up the development environment on Windows

echo.
echo ========================================
echo  InvoiceForge Development Setup
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 22.x from https://nodejs.org/
    echo Or use nvm-windows: https://github.com/coreybutler/nvm-windows
    echo.
    pause
    exit /b 1
)

:: Check Node.js version
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js version: %NODE_VERSION%

:: Check if npm is available
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

:: Check npm version
for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [INFO] npm version: %NPM_VERSION%

:: Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [INFO] Setting up Git hooks...
call npm run prepare
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to setup Git hooks
    pause
    exit /b 1
)

echo.
echo [INFO] Running type check...
call npm run type-check
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] TypeScript type check failed
    pause
    exit /b 1
)

echo.
echo [INFO] Running linter...
call npm run lint
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ESLint check failed
    pause
    exit /b 1
)

echo.
echo [INFO] Running tests...
call npm run test:ci
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Tests failed
    pause
    exit /b 1
)

:: Create .env.local from .env.example if it doesn't exist
if not exist ".env.local" (
    if exist ".env.example" (
        echo.
        echo [INFO] Creating .env.local from .env.example...
        copy ".env.example" ".env.local" >nul
        echo [INFO] Please edit .env.local with your configuration
    )
)

echo.
echo ========================================
echo  Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env.local with your configuration
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
echo Available commands:
echo   npm run dev          - Start development server
echo   npm run build        - Build for production
echo   npm run test         - Run tests
echo   npm run lint         - Check code quality
echo   npm run format       - Format code
echo.

pause
