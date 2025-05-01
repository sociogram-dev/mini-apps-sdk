import { urlSafeDecode, urlParseQueryString, safeParseUrlParams } from '../utils/core.utils';

export type EventType = string;
export type EventData = unknown;
export type EventCallback = (eventType: EventType, eventData: EventData) => void;
export type EventHandler = Record<EventType, EventCallback[]>;

export type InvoiceStatus = 'success' | 'failed';
export type InvoiceCallback = (status: InvoiceStatus) => void;

export interface WebViewAPI {
  initParams: Record<string, string | null>;
  isIframe: boolean;
  postEvent: (eventType: EventType, callback?: () => void, eventData?: EventData) => void;
  receiveEvent: (eventType: EventType, eventData: EventData) => void;
  callEventCallbacks: (eventType: EventType, func: (callback: EventCallback) => void) => void;
  postMessage: (message: Record<string, unknown>) => void;
  onEvent: (eventType: EventType, callback: EventCallback) => void;
  offEvent: (eventType: EventType, callback: EventCallback) => void;
}

export interface MiniAppData {
  initData: Record<string, string | null>;
  version: string;
  platform?: string;
}

export interface MiniAppAPI {
  get initData(): Record<string, string | null>;
  get version(): string;
  platform?: string;
  copyToClipboard: (text: string, callback?: () => void) => void;
  openLink: (url: string, options?: Record<string, unknown>) => void;
  openLoginModal: (callback?: () => void) => void;
  openTelegramLink: (url: string, options?: Record<string, unknown>) => void;
  openInvoice: (data: Record<string, unknown>, callback?: InvoiceCallback) => string;
}

declare global {
  interface Window {
    Sociogram: {
      WebView: WebViewAPI;
      Utils: {
        urlSafeDecode: typeof urlSafeDecode;
        urlParseQueryString: typeof urlParseQueryString;
        safeParseUrlParams: typeof safeParseUrlParams;
      };
      MiniApp: MiniAppAPI;
    };
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
