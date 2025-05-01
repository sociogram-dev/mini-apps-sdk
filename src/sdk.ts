import './sociogram-mini-apps';
import { MiniAppAPI } from './types/sociogram-mini-apps.types';

const sociogramWindow = window as unknown as Window & { Sociogram: { MiniApp: MiniAppAPI } };

export const MiniApp = sociogramWindow.Sociogram.MiniApp;
