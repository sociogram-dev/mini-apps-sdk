import { urlParseHashParams, urlSafeDecode, urlParseQueryString } from './utils/core.utils';
import {
  EventType,
  EventData,
  EventCallback,
  EventHandler,
  WebViewAPI,
  MiniAppData,
  MiniAppAPI,
} from './types/sociogram-mini-apps.types';

// Declare Sociogram namespace on window
declare global {
  interface Window {
    Sociogram: {
      WebView: WebViewAPI;
      Utils: {
        urlSafeDecode: typeof urlSafeDecode;
        urlParseQueryString: typeof urlParseQueryString;
        urlParseHashParams: typeof urlParseHashParams;
      };
      MiniApp: MiniAppAPI;
    };
  }
}

const createWebView = (): WebViewAPI => {
  const eventHandlers: EventHandler = {};

  let locationHash = '';
  try {
    locationHash = location.hash.toString();
  } catch (error) {
    console.error('Failed to get location hash:', error);
  }

  const initParams = urlParseHashParams(locationHash);

  let isIframe = false;
  try {
    isIframe = window.parent !== window;

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
    initData: '',
    initDataUnsafe: {},
    version: '1.0',
  };

  const miniApp: MiniAppAPI = {
    get initData() {
      return miniAppData.initData;
    },
    get initDataUnsafe() {
      return miniAppData.initDataUnsafe;
    },
    get version() {
      return miniAppData.version;
    },

    openLink: (url: string, options?: Record<string, unknown>) => {
      console.log('[Sociogram.MiniApp] openLink', url, options);
      webView.postEvent('mini_app_open_link', () => {}, { url, options });
    },

    openInvoice: (data: Record<string, unknown>, callback?: () => void) => {
      console.log('[Sociogram.MiniApp] openInvoice', data);
      webView.postEvent('mini_app_open_invoice', () => {}, { data });
      callback?.();
    },

    showPopup: (params: Record<string, unknown>, callback?: () => void) => {
      console.log('[Sociogram.MiniApp] showPopup', params, callback);
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
    urlParseHashParams,
  };

  window.Sociogram.MiniApp = createMiniApp(webView);
};

// Initialize the API
initSociogramAPI();
