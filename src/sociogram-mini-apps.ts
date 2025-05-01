import { urlSafeDecode, urlParseQueryString, safeParseUrlParams } from './utils/core.utils';
import {
  EventType,
  EventData,
  EventCallback,
  EventHandler,
  WebViewAPI,
  MiniAppData,
  MiniAppAPI,
} from './types/sociogram-mini-apps.types';

const createWebView = (): WebViewAPI => {
  const eventHandlers: EventHandler = {};

  const initParams = safeParseUrlParams();

  let isIframe = false;
  try {
    // First check if we're in React Native WebView
    if (window.ReactNativeWebView) {
      isIframe = false;
    } else {
      // If not in React Native, check if we're in an iframe
      isIframe = window.parent !== window;
    }

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
  } catch (error) {
    console.error('Failed to initialize iframe:', error);
  }

  const postMessage = (message: Record<string, unknown>) => {
    const messageString = JSON.stringify(message);

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(messageString);
    } else if (isIframe) {
      window.parent.postMessage(messageString, '*');
    }
  };

  const postEvent = (eventType: EventType, callback?: () => void, eventData: EventData = '') => {
    console.log('[Sociogram.WebView] > postEvent', eventType, eventData);
    if (isIframe) {
      try {
        postMessage({ eventType, eventData });
        callback?.();
      } catch (error) {
        callback?.();
        console.error('Failed to post message:', error);
      }
    } else {
      callback?.();
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

  return {
    initParams,
    isIframe,
    postEvent,
    receiveEvent,
    callEventCallbacks,
    postMessage,
  };
};

const createMiniApp = (webView: WebViewAPI): MiniAppAPI => {
  const miniAppData: MiniAppData = {
    initData: webView.initParams,
    version: '1.0',
  };

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

    openInvoice: (data: Record<string, unknown>, callback?: () => void) => {
      webView.postEvent('mini_app_open_invoice', () => {}, { data });
      callback?.();
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
