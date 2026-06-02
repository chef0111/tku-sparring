import { toPng } from 'html-to-image';

export type BracketScreenshotTheme = 'light' | 'dark';

export type CaptureBracketPngOptions = {
  root: HTMLElement;
  width: number;
  height: number;
  theme: BracketScreenshotTheme;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
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

  const frame = document.createElement('div');
  frame.className = `canvas-background ${theme}`;
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.position = 'relative';
  frame.style.overflow = 'hidden';

  const clone = root.cloneNode(true) as HTMLElement;
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
    return dataUrlToBlob(dataUrl);
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
