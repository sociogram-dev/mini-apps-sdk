import { urlSafeDecode, urlParseQueryString, safeParseUrlParams } from './utils/core.utils';
import {
  EventType,
  EventData,
  EventCallback,
  EventHandler,
  WebViewAPI,
  MiniAppData,
  MiniAppAPI,
  InvoiceStatus,
  InvoiceCallback,
} from './types/sociogram-mini-apps.types';

const detectEnvironment = () => {
  if (window.ReactNativeWebView) {
    return { isIframe: false, environment: 'react-native' } as const;
  }
  const isIframe = window.parent !== window;
  return { isIframe, environment: isIframe ? 'iframe' : 'web' } as const;
};

const createWebView = (): WebViewAPI => {
  const eventHandlers: EventHandler = {};
  const initParams = safeParseUrlParams();
  const { isIframe, environment } = detectEnvironment();

  const postMessage = (message: Record<string, unknown>) => {
    const messageString = JSON.stringify(message);
    if (environment === 'react-native' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(messageString);
    } else if (isIframe) {
      window.parent.postMessage(messageString, '*');
    }
  };

  const receiveEvent = (eventType: EventType, eventData: EventData) => {
    console.log('[Sociogram.WebView] < receiveEvent', eventType, eventData);
    callEventCallbacks(eventType, callback => {
      callback(eventType, eventData);
    });
  };

  const callEventCallbacks = (eventType: EventType, func: (callback: EventCallback) => void) => {
    const curEventHandlers = eventHandlers[eventType];
    if (!curEventHandlers?.length) return;

    for (const handler of curEventHandlers) {
      try {
        func(handler);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }
  };

  const onEvent = (eventType: EventType, callback: EventCallback) => {
    if (eventHandlers[eventType] === undefined) {
      eventHandlers[eventType] = [];
    }
    const index = eventHandlers[eventType].indexOf(callback);
    if (index === -1) {
      eventHandlers[eventType].push(callback);
    }
  };

  const offEvent = (eventType: EventType, callback: EventCallback) => {
    if (eventHandlers[eventType] === undefined) {
      return;
    }
    const index = eventHandlers[eventType].indexOf(callback);
    if (index === -1) {
      return;
    }
    eventHandlers[eventType].splice(index, 1);
  };

  if (isIframe) {
    window.addEventListener('message', event => {
      if (event.source !== window.parent) return;

      let dataParsed;
      try {
        dataParsed = JSON.parse(event.data);
      } catch (error) {
        console.error('Failed to parse message data:', error);
        return;
      }

      if (!dataParsed?.eventType) return;

      if (dataParsed.eventType === 'reload_iframe') {
        try {
          window.parent.postMessage(JSON.stringify({ eventType: 'iframe_will_reload' }), '*');
        } catch (error) {
          console.error('Failed to post reload message:', error);
        }
        location.reload();
      } else {
        receiveEvent(dataParsed.eventType, dataParsed.eventData);
      }
    });

    try {
      window.parent.postMessage(
        JSON.stringify({
          eventType: 'iframe_ready',
          eventData: { reload_supported: true },
        }),
        '*'
      );
    } catch (error) {
      console.error('Failed to post iframe ready message:', error);
    }
  }

  const postEvent = (eventType: EventType, callback?: () => void, eventData: EventData = '') => {
    console.log('[Sociogram.WebView] > postEvent', eventType, eventData);
    try {
      postMessage({ eventType, eventData });
      callback?.();
    } catch (error) {
      callback?.();
      console.error('Failed to post message:', error);
    }
  };

  return {
    initParams,
    isIframe,
    postEvent,
    receiveEvent,
    callEventCallbacks,
    postMessage,
    onEvent,
    offEvent,
  };
};

const createMiniApp = (webView: WebViewAPI): MiniAppAPI => {
  const miniAppData: MiniAppData = {
    initData: webView.initParams,
    version: '1.0',
  };

  const activeInvoices: Map<string, InvoiceCallback> = new Map();

  webView.onEvent('invoice_closed', (eventType: EventType, eventData: EventData) => {
    const { invoiceId, status } = eventData as { invoiceId: string; status: InvoiceStatus };
    const callback = activeInvoices.get(invoiceId);
    if (callback) {
      callback(status);
      activeInvoices.delete(invoiceId);
    }
  });

  const miniApp: MiniAppAPI = {
    get initData() {
      return miniAppData.initData;
    },
    get version() {
      return miniAppData.version;
    },

    copyToClipboard: (text: string, callback?: () => void) => {
      webView.postEvent('mini_app_copy_to_clipboard', () => {}, { text });
      callback?.();
    },

    openLink: (url: string, options?: Record<string, unknown>) => {
      webView.postEvent('mini_app_open_link', () => {}, { url, options });
    },

    openLoginModal: (callback?: () => void) => {
      webView.postEvent('mini_app_open_login_modal', () => {}, {});
      callback?.();
    },

    openTelegramLink: (url: string, options?: Record<string, unknown>) => {
      webView.postEvent('mini_app_open_telegram_link', () => {}, { url, options });
    },

    openInvoice: (invoiceData: Record<string, unknown>, callback?: InvoiceCallback) => {
      const invoiceId =
        invoiceData.id?.toString() || `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (callback) {
        activeInvoices.set(invoiceId, callback);
      }

      const completeInvoiceData = {
        ...invoiceData,
        id: invoiceId,
      };

      webView.postEvent('mini_app_open_invoice', () => {}, {
        data: completeInvoiceData,
      });

      return invoiceId;
    },
  };

  return miniApp;
};

// Initialize and expose the modules
const initSociogramAPI = () => {
  // Create namespace if it doesn't exist
  window.Sociogram = window.Sociogram || {};

  // Create and expose WebView
  const webView = createWebView();
  window.Sociogram.WebView = webView;

  // Create and expose Utils
  window.Sociogram.Utils = {
    urlSafeDecode,
    urlParseQueryString,
    safeParseUrlParams,
  };

  window.Sociogram.MiniApp = createMiniApp(webView);
};

// Initialize the API
initSociogramAPI();
