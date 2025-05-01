import './sociogram-mini-apps';
import { Sociogram, MiniApp as MiniAppTypes } from './types';

const sociogramWindow = window as unknown as Window & { Sociogram: Sociogram };

export const MiniApp: MiniAppTypes = sociogramWindow.Sociogram.MiniApp;
