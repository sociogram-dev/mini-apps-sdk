# Sociogram Mini Apps SDK

A TypeScript SDK for creating mini apps that integrate with Sociogram.

## Installation

```bash
npm install @sociogram-dev/mini-apps-sdk
# or
yarn add @sociogram-dev/mini-apps-sdk
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions. You can use it in your TypeScript projects with full type safety and autocompletion.

## Usage

### Basic Setup

```typescript
import { Sociogram } from '@sociogram-dev/mini-apps-sdk';

// The SDK is automatically initialized and available globally
const miniApp = Sociogram.MiniApp;

// Access initial data
console.log(miniApp.initData);

// Get SDK version
console.log(miniApp.version);

// Check platform (optional)
console.log(miniApp.platform);
```

### User Interactions

```typescript

// Get user's followers
const followersRequestId = miniApp.getFollowers(
  { limit: 10, cursor: 'next_page_cursor' },
  (response) => {
    if (response.error) {
      console.error(response.error);
      return;
    }
    console.log('Followers:', response.rows);
    console.log('Next cursor:', response.cursor);
  }
);

// Get users that a user is following
const followingRequestId = miniApp.getFollowing(
  { limit: 10 },
  (response) => {
    if (response.error) {
      console.error(response.error);
      return;
    }
    console.log('Following:', response.rows);
  }
);

// Get user's friends
const friendsRequestId = miniApp.getFriends(
  { limit: 10 },
  (response) => {
    if (response.error) {
      console.error(response.error);
      return;
    }
    console.log('Friends:', response.rows);
  }
);
```

### Post Actions

```typescript
// Like a post
miniApp.openLikeModal({
  postId: 'post_id'
});

// Tip a post
miniApp.openTipModal({
  postId: 'post_id'
});

// Reward a post
miniApp.openRewardModal({
  postId: 'post_id'
});
```

### Navigation and Sharing

```typescript
// Open a link in the browser
miniApp.openLink('https://example.com', {
  // Optional parameters
  target: '_blank'
});

// Open a Telegram link
miniApp.openTelegramLink('https://t.me/example', {
  // Optional parameters
  target: '_blank'
});

// Share content
miniApp.share({
  text: 'Check this out!',
  url: 'https://example.com'
});
```

### Clipboard Operations

```typescript
// Read text from clipboard
miniApp.readTextFromClipboard('text_to_read');
```

### Invoice Handling

```typescript
// Open an invoice
const invoiceId = miniApp.openInvoice(
  {
    title: 'Purchase Item',
    price: 10,
    currency: 'usd', // or 'sol'
    invoicePayload: {
      // Your custom payload data
      itemId: '123',
      description: 'Premium subscription'
    }
  },
  (status) => {
    if (status === 'success') {
      console.log('Payment successful!');
    } else {
      console.log('Payment failed');
    }
  }
);
```

### WebView Communication

```typescript
// Access WebView API directly
const webView = Sociogram.WebView;

// Post an event
webView.postEvent('custom_event', { data: 'value' });

// Listen for events
webView.onEvent('custom_event', (eventType, eventData) => {
  console.log(`Received ${eventType}:`, eventData);
});

// Remove event listener
webView.offEvent('custom_event', callback);

// Check if running in iframe
const isIframe = webView.isIframe;

// Access initialization parameters
const initParams = webView.initParams;
```

### Utility Functions

```typescript
const { urlSafeDecode, urlParseQueryString, safeParseUrlParams } = Sociogram.Utils;

// Decode URL-safe strings
const decoded = urlSafeDecode('encoded_string');

// Parse query string
const params = urlParseQueryString('?key=value');

// Safely parse URL parameters
const safeParams = safeParseUrlParams();
```

## Type Definitions

The SDK provides comprehensive TypeScript type definitions. Here are the main types:

### User Interface

```typescript
interface User {
  _id: string;
  id: string;
  address: string;
  domain: string | null;
  name: string;
  avatar: string;
  verified: boolean;
  subscription: {
    following: number;
    followers: number;
  };
  twitter: {
    twitterId: string | null;
    name: string | null;
    followers: number;
  };
  isFollowed: boolean;
}
```

### API Response Types

```typescript
interface UsersResponse {
  cursor: string | null;
  rows: User[];
  error?: string;
}

interface PostActionResponse {
  status: 'success' | 'failed';
  message?: string;
}

interface InvoiceData {
  invoicePayload: Record<string, unknown>;
  title: string;
  price: number;
  currency: CurrencyType;
}

enum CurrencyType {
  USD = 'usd',
  SOL = 'sol'
}
```

### Event Handling

```typescript
type EventCallback = (eventType: string, eventData: unknown) => void;

// Register event handler
Sociogram.WebView.onEvent('event_type', (type, data) => {
  console.log(`Event ${type}:`, data);
});

// Remove event handler
Sociogram.WebView.offEvent('event_type', callback);
```

## Environment Detection

The SDK automatically detects the environment it's running in:

- `iframe`: When running inside an iframe
- `react-native`: When running in a React Native WebView
- `web`: When running in a regular web browser

```typescript
const isIframe = Sociogram.WebView.isIframe;
```

## Error Handling

The SDK provides error handling through callbacks and response objects:

```typescript
// Error handling in user list responses
miniApp.getFollowers({}, (response) => {
  if (response.error) {
    console.error('Error fetching followers:', response.error);
    return;
  }
  // Handle successful response
});

// Error handling in invoice callbacks
miniApp.openInvoice(invoiceData, (status) => {
  if (status === 'failed') {
    console.error('Payment failed');
    return;
  }
  // Handle successful payment
});
```

## Development

### Building

```bash
# Install dependencies
yarn install

# Build the SDK
yarn build

# Watch mode for development
yarn build:watch
```

### Testing

```bash
# Run tests
yarn test

# Watch mode for tests
yarn test:watch
```

## License

MIT