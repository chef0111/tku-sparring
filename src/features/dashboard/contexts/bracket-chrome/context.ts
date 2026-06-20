import { createContext } from 'react';

export type BracketCaptureTarget = {
  root: HTMLElement;
  width: number;
  height: number;
};

export interface BracketChromeContextValue {
  isFullscreen: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleFullscreen: () => void;
  screenshotOpen: boolean;
  setScreenshotOpen: (open: boolean) => void;
  captureTarget: BracketCaptureTarget | null;
  setCaptureTarget: (target: BracketCaptureTarget | null) => void;
}

export const BracketChromeContext = createContext<
  BracketChromeContextValue | undefined
>(undefined);
