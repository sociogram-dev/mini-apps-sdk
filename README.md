# Sociogram Mini Apps SDK

A TypeScript SDK for creating mini applications that integrate with the Sociogram platform. This SDK provides a set of tools and APIs to build interactive mini apps that can be embedded within the Sociogram ecosystem.

## Features

- WebView communication bridge for seamless integration
- Event handling system for bi-directional communication
- Support for both iframe and React Native WebView environments
- Utility functions for URL parsing and parameter handling
- Type-safe API with TypeScript support

## Installation

```bash
npm install mini-apps-sdk
# or
yarn add mini-apps-sdk
```

## Usage

### Basic Setup

```typescript
// Your mini app will automatically have access to the Sociogram namespace
// through the window object after including the SDK

// Access the WebView API
const webView = window.Sociogram.WebView;

// Access utility functions
const { urlSafeDecode, urlParseQueryString, urlParseHashParams } = window.Sociogram.Utils;

// Access MiniApp API
const miniApp = window.Sociogram.MiniApp;
```

### WebView API

The WebView API provides methods for communication between your mini app and the Sociogram platform:

```typescript
// Post events to the platform
webView.postEvent('event_name', callback, eventData);

// Receive events from the platform
webView.receiveEvent('event_name', eventData);

// Check if running in iframe
const isIframe = webView.isIframe;

// Access initialization parameters
const initParams = webView.initParams;
```

### MiniApp API

The MiniApp API provides high-level functionality for your mini app:

```typescript
// Open external links
miniApp.openLink('https://example.com', { options });

// Open invoice
miniApp.openInvoice(invoiceData, callback);

// Show popup
miniApp.showPopup(popupParams, callback);

// Access initialization data
const initData = miniApp.initData;
const initDataUnsafe = miniApp.initDataUnsafe;
const version = miniApp.version;
```

## Development

### Prerequisites

- Node.js
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the SDK
- `npm run build:watch` - Build the SDK in watch mode
- `npm run preview` - Preview the build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 