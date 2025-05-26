import './sociogram-mini-apps';
import { MiniAppAPI } from './types';

const sociogramWindow = window as unknown as Window & { Sociogram: { MiniApp: MiniAppAPI } };

export const MiniApp = sociogramWindow.Sociogram.MiniApp;
