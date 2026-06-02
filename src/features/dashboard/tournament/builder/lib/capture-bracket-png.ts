import { toPng } from 'html-to-image';

export type BracketScreenshotTheme = 'light' | 'dark';

export type CaptureBracketPngOptions = {
  root: HTMLElement;
  width: number;
  height: number;
  theme: BracketScreenshotTheme;
};

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function captureBracketPng({
  root,
  width,
  height,
  theme,
}: CaptureBracketPngOptions): Promise<Blob> {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';

  host.classList.remove('light', 'dark');
  host.classList.add(theme);

  const frame = document.createElement('div');
  frame.className = 'canvas-background';
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.position = 'relative';
  frame.style.overflow = 'hidden';

  const clone = root.cloneNode(true) as HTMLElement;
  clone.classList.remove('light', 'dark');
  clone.classList.add(theme);
  clone.style.transform = 'none';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.position = 'relative';

  frame.appendChild(clone);
  host.appendChild(frame);
  document.body.appendChild(host);

  try {
    const dataUrl = await toPng(frame, {
      width,
      height,
      pixelRatio: 2,
      cacheBust: true,
    });
    return await dataUrlToBlob(dataUrl);
  } finally {
    host.remove();
  }
}

export async function captureBracketBothThemes(
  root: HTMLElement,
  width: number,
  height: number
): Promise<Record<BracketScreenshotTheme, Blob>> {
  const [light, dark] = await Promise.all([
    captureBracketPng({ root, width, height, theme: 'light' }),
    captureBracketPng({ root, width, height, theme: 'dark' }),
  ]);
  return { light, dark };
}

export function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export function bracketScreenshotFilename(
  tournamentName: string,
  groupName: string
): string {
  const tournament = sanitizeFilenamePart(tournamentName) || 'tournament';
  const group = sanitizeFilenamePart(groupName) || 'group';
  return `${tournament}-${group}-bracket.png`;
}
