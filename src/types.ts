/**
 * User information interface
 */
export interface UserInfo {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  [key: string]: any;
}

/**
 * Theme configuration interface
 */
export interface ThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  isDark: boolean;
  [key: string]: any;
}

/**
 * Viewport information interface
 */
export interface ViewportInfo {
  width: number;
  height: number;
  isExpanded: boolean;
  [key: string]: any;
}

/**
 * Event handler type
 */
export interface EventHandler {
  (eventType: string, eventData: unknown): void;
}

/**
 * Event handlers type
 */
export interface EventHandlers {
  [key: string]: EventHandler[];
}

export interface MiniApp {
  init(): MiniApp;
  onEvent(eventName: string, callback: EventHandler): MiniApp;
  onReady(callback: EventHandler): MiniApp;
  getTheme(): ThemeParams;
  getColorScheme(): 'dark' | 'light';
  getUser(): UserInfo | null;
  getPlatform(): string;
  isMobile(): boolean;
  getViewport(): ViewportInfo | null;
  sendData(data: any): void;
  openLink(url: string): void;
  close(): void;
}

export interface Sociogram {
  MiniApp: MiniApp;
}

export interface InitParams {
  [key: string]: string | undefined;
}