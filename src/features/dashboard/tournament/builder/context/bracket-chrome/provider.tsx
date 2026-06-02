import * as React from 'react';
import { BracketChromeContext } from './context';
import type { BracketCaptureTarget } from './context';

export function BracketChromeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [screenshotOpen, setScreenshotOpen] = React.useState(false);
  const [captureTarget, setCaptureTarget] =
    React.useState<BracketCaptureTarget | null>(null);

  const enterFullscreen = React.useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = React.useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      isFullscreen,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
      screenshotOpen,
      setScreenshotOpen,
      captureTarget,
      setCaptureTarget,
    }),
    [
      isFullscreen,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
      screenshotOpen,
      captureTarget,
    ]
  );

  return (
    <BracketChromeContext.Provider value={value}>
      {children}
    </BracketChromeContext.Provider>
  );
}
