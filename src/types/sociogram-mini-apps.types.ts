import { urlParseHashParams, urlSafeDecode, urlParseQueryString } from '../utils/core.utils';

export type EventType = string;
export type EventData = unknown;
export type EventCallback = (eventType: EventType, eventData: EventData) => void;
export type EventHandler = Record<EventType, EventCallback[]>;

export interface WebViewAPI {
  initParams: Record<string, string | undefined>;
  isIframe: boolean;
  postEvent: (eventType: EventType, callback?: () => void, eventData?: EventData) => void;
  receiveEvent: (eventType: EventType, eventData: EventData) => void;
  callEventCallbacks: (eventType: EventType, func: (callback: EventCallback) => void) => void;
  postMessage: (message: Record<string, unknown>) => void;
}

export interface MiniAppData {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  version: string;
  platform?: string;
}

export interface MiniAppAPI {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  version: string;
  platform?: string;
  openLink: (url: string, options?: Record<string, unknown>) => void;
  openInvoice: (data: Record<string, unknown>, callback?: () => void) => void;
  showPopup: (params: Record<string, unknown>, callback?: () => void) => void;
}

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
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
