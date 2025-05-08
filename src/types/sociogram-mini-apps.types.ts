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

export interface User {
  _id: string;
  createdAt: string;
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

export interface UsersResponse {
  cursor: string | null;
  rows: User[];
  error?: string;
}

export interface GetUsersParams {
  limit?: number;
  cursor?: string;
}

export interface MiniAppAPI {
  get initData(): Record<string, string | null>;
  get version(): string;
  platform?: string;
  followUser: (address: string, callback?: (status: string) => void) => void;
  readTextFromClipboard: (text: string, callback?: () => void) => void;
  openLink: (url: string, options?: Record<string, unknown>) => void;
  openTelegramLink: (url: string, options?: Record<string, unknown>) => void;
  openInvoice: (data: Record<string, unknown>, callback?: InvoiceCallback) => string;
  getFollowers: (params?: GetUsersParams, callback?: (response: UsersResponse) => void) => string;
  getFollowing: (params?: GetUsersParams, callback?: (response: UsersResponse) => void) => string;
  getFriends: (params?: GetUsersParams, callback?: (response: UsersResponse) => void) => string;
  share: (text: string) => void;
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
