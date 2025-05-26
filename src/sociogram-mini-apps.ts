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
  UsersResponse,
  GetUsersParams,
  InvoiceData,
  PostActionData,
  PostActionResponse,
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

  if (isIframe || environment === 'react-native') {
    window.addEventListener('message', event => {
      if (event.source !== window.parent && environment !== 'react-native') return;

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
      postMessage({
        eventType: 'iframe_ready',
        eventData: { reload_supported: true },
      });
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
  const activeFollowersCallbacks: Map<string, (response: UsersResponse) => void> = new Map();
  const activeFollowingCallbacks: Map<string, (response: UsersResponse) => void> = new Map();
  const activeFriendsCallbacks: Map<string, (response: UsersResponse) => void> = new Map();
  const activeFollowUserCallbacks: Map<string, (status: string) => void> = new Map();
  const activePostActionCallbacks: Map<string, (response: PostActionResponse) => void> = new Map();

  webView.onEvent('mini_app_follow_user_response', (_, eventData: EventData) => {
    const data = eventData as { address: string; status: string };
    const callback = activeFollowUserCallbacks.get(data.address);
    if (callback) {
      callback(data.status);
      activeFollowUserCallbacks.delete(data.address);
    }
  });

  webView.onEvent('mini_app_invoice_closed', (_, eventData: EventData) => {
    const { invoiceId, status } = eventData as { invoiceId: string; status: InvoiceStatus };
    const callback = activeInvoices.get(invoiceId);
    if (callback) {
      callback(status);
      activeInvoices.delete(invoiceId);
    }
  });

  webView.onEvent('mini_app_get_followers_response', (_, eventData: EventData) => {
    const data = eventData as { requestId: string; response: UsersResponse };
    const callback = activeFollowersCallbacks.get(data.requestId);
    if (callback) {
      callback(data.response);
      activeFollowersCallbacks.delete(data.requestId);
    }
  });

  webView.onEvent('mini_app_get_following_response', (_, eventData: EventData) => {
    const data = eventData as { requestId: string; response: UsersResponse };
    const callback = activeFollowingCallbacks.get(data.requestId);
    if (callback) {
      callback(data.response);
      activeFollowingCallbacks.delete(data.requestId);
    }
  });

  webView.onEvent('mini_app_get_friends_response', (_, eventData: EventData) => {
    const data = eventData as { requestId: string; response: UsersResponse };
    const callback = activeFriendsCallbacks.get(data.requestId);
    if (callback) {
      callback(data.response);
      activeFriendsCallbacks.delete(data.requestId);
    }
  });

  webView.onEvent('mini_app_post_action_response', (_, eventData: EventData) => {
    const data = eventData as { requestId: string; response: PostActionResponse };
    const callback = activePostActionCallbacks.get(data.requestId);
    if (callback) {
      callback(data.response);
      activePostActionCallbacks.delete(data.requestId);
    }
  });

  const miniApp: MiniAppAPI = {
    get initData() {
      return miniAppData.initData;
    },
    get version() {
      return miniAppData.version;
    },

    followUser: (address: string, callback?: (status: string) => void) => {
      if (callback) {
        activeFollowUserCallbacks.set(address, callback);
      }
      webView.postEvent('mini_app_follow_user', () => {}, { address });
    },

    readTextFromClipboard: (text: string, callback?: () => void) => {
      webView.postEvent('mini_app_read_text_from_clipboard', () => {}, { text });
      callback?.();
    },

    openLink: (url: string, options?: Record<string, unknown>) => {
      webView.postEvent('mini_app_open_link', () => {}, { url, options });
    },

    openTelegramLink: (url: string, options?: Record<string, unknown>) => {
      webView.postEvent('mini_app_open_telegram_link', () => {}, { url, options });
    },

    openInvoice: (invoiceData: InvoiceData, callback?: InvoiceCallback) => {
      const invoiceId = `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (callback) {
        activeInvoices.set(invoiceId, callback);
      }

      const completeInvoiceData = {
        ...invoiceData,
        invoiceId,
      };

      webView.postEvent('mini_app_open_invoice', () => {}, completeInvoiceData);

      return invoiceId;
    },

    getFollowers: (params?: GetUsersParams, callback?: (response: UsersResponse) => void) => {
      const requestId = `followers_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (callback) {
        activeFollowersCallbacks.set(requestId, callback);
      }

      webView.postEvent('mini_app_get_followers', () => {}, { requestId, ...params });

      return requestId;
    },

    getFollowing: (params?: GetUsersParams, callback?: (response: UsersResponse) => void) => {
      const requestId = `following_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (callback) {
        activeFollowingCallbacks.set(requestId, callback);
      }

      webView.postEvent('mini_app_get_following', () => {}, { requestId, ...params });

      return requestId;
    },

    getFriends: (params?: GetUsersParams, callback?: (response: UsersResponse) => void) => {
      const requestId = `friends_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (callback) {
        activeFriendsCallbacks.set(requestId, callback);
      }

      webView.postEvent('mini_app_get_friends', () => {}, { requestId, ...params });

      return requestId;
    },

    share: (data: { text: string; url: string }) => {
      webView.postEvent('mini_app_share', () => {}, data);
    },

    openRewardModal: (data: PostActionData, callback?: (response: PostActionResponse) => void) => {
      const requestId = `reward_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (callback) {
        activePostActionCallbacks.set(requestId, callback);
      }

      webView.postEvent('mini_app_open_reward_modal', () => {}, { requestId, ...data });
    },

    openTipModal: (data: PostActionData, callback?: (response: PostActionResponse) => void) => {
      const requestId = `tip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (callback) {
        activePostActionCallbacks.set(requestId, callback);
      }

      webView.postEvent('mini_app_open_tip_modal', () => {}, { requestId, ...data });
    },

    openLikeModal: (data: PostActionData, callback?: (response: PostActionResponse) => void) => {
      const requestId = `like_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (callback) {
        activePostActionCallbacks.set(requestId, callback);
      }

      webView.postEvent('mini_app_open_like_modal', () => {}, { requestId, ...data });
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
    safeParseUrlParams,
    urlSafeDecode,
    urlParseQueryString,
  };

  window.Sociogram.MiniApp = createMiniApp(webView);
};

// Initialize the API
initSociogramAPI();
