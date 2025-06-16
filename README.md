# Matrix Shuffler

A web application for matrix reordering.

## Prerequisites

- Node.js (version 16 or higher)
- pnpm (if you don't have it, install it using one of these methods):

### Installing pnpm

**Using npm (recommended):**

```bash
npm install -g pnpm
```

**Using Homebrew (macOS):**

```bash
brew install pnpm
```

**Using Linux (using npm):**

```bash
npm install -g pnpm
```

## Getting Started

Clone the repository
Install dependencies:

```bash
pnpm install
```

## Development

Start the development server:

```bash
pnpm dev
```

## Building for Production

Create a production build:

```bash
pnpm build
```

## Tauri Setup

To use Tauri for building native desktop applications, follow these steps:

### 1. Install Rust

Tauri requires Rust and Cargo. Install them using [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Install Tauri CLI

Tauri CLI is added as a development dependency. Make sure that it is installed:

```bash
pnpm install
```

### 3. Check Tauri Installation

To verify if Tauri is installed:

```bash
pnpm tauri --version
```

### 4. Install Native Build Tools

- **macOS:**
  ```bash
  xcode-select --install
  ```
- **Windows:**  
  Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
- **Linux:**  
  See [Tauri's prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites/#installing) for your distribution.

### 5. Development

To run the app in development mode with Tauri:

```bash
pnpm tauri dev
```

### 6. Build for Production

To create a production desktop build:

```bash
pnpm tauri build
```

For more details, see the [Tauri documentation](https://tauri.app/v1/guides/getting-started/).

## IDE Setup

We recommend using [VSCode](https://code.visualstudio.com/) with the [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension. Make sure to disable Vetur if you have it installed.

## TypeScript Support

This project uses TypeScript with Vue. For proper type checking:

- We use `vue-tsc` instead of `tsc` for type checking
- The Volar extension provides TypeScript support for `.vue` files

## Configuration

For customizing the build configuration, see the [Vite Configuration Reference](https://vite.dev/config/).
