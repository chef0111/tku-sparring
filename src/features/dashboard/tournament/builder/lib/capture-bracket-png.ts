import { toPng } from 'html-to-image';

/** Light tokens when a stylesheet omits `:root` in the capture iframe. */
const LIGHT_CAPTURE_VARS: Record<string, string> = {
  '--background': 'oklch(1 0 0)',
  '--foreground': 'oklch(0.141 0.005 285.823)',
  '--card': 'oklch(1 0 0)',
  '--card-foreground': 'oklch(0.141 0.005 285.823)',
  '--popover': 'oklch(1 0 0)',
  '--popover-foreground': 'oklch(0.141 0.005 285.823)',
  '--primary': 'oklch(0.21 0.006 285.885)',
  '--primary-foreground': 'oklch(0.985 0 0)',
  '--secondary': 'oklch(0.967 0.001 286.375)',
  '--secondary-foreground': 'oklch(0.21 0.006 285.885)',
  '--muted': 'oklch(0.967 0.001 286.375)',
  '--muted-foreground': 'oklch(0.552 0.016 285.938)',
  '--accent': 'oklch(0.967 0.001 286.375)',
  '--accent-foreground': 'oklch(0.21 0.006 285.885)',
  '--destructive': 'oklch(0.577 0.245 27.325)',
  '--border': 'oklch(0.92 0.004 286.32)',
  '--input': 'oklch(0.92 0.004 286.32)',
  '--ring': 'oklch(0.705 0.015 286.067)',
};

const CAPTURE_BACKGROUND = '#ffffff';
/** Extra inset around the bracket content in exported PNGs. */
const CAPTURE_PAD_X = 48;
const CAPTURE_PAD_Y = 48;

export type CaptureBracketPngOptions = {
  root: HTMLElement;
  width: number;
  height: number;
};

function applyLightCaptureTheme(el: HTMLElement) {
  el.style.colorScheme = 'light';
  for (const [key, value] of Object.entries(LIGHT_CAPTURE_VARS)) {
    el.style.setProperty(key, value);
  }
}

function enforceSlotTruncation(root: ParentNode) {
  for (const slot of root.querySelectorAll('[data-bracket-slot]')) {
    for (const name of slot.querySelectorAll('span')) {
      if (!(name instanceof HTMLElement)) continue;
      name.style.overflow = 'hidden';
      name.style.textOverflow = 'ellipsis';
      name.style.whiteSpace = 'nowrap';
    }
  }
}

type ContentBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Tight visual bounds — ignores full-canvas SVG size so empty layout slack is cropped. */
function measureBracketContentBounds(root: HTMLElement): ContentBounds {
  const rootRect = root.getBoundingClientRect();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const addRect = (rect: DOMRect) => {
    if (rect.width <= 0 && rect.height <= 0) return;
    minX = Math.min(minX, rect.left - rootRect.left);
    minY = Math.min(minY, rect.top - rootRect.top);
    maxX = Math.max(maxX, rect.right - rootRect.left);
    maxY = Math.max(maxY, rect.bottom - rootRect.top);
  };

  for (const el of root.querySelectorAll('.absolute.z-1, .absolute.z-1 *')) {
    if (el instanceof SVGSVGElement) continue;
    addRect(el.getBoundingClientRect());
  }

  for (const el of root.querySelectorAll('svg text, svg path')) {
    addRect(el.getBoundingClientRect());
  }

  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, width: root.offsetWidth, height: root.offsetHeight };
  }

  const bleed = 2;
  return {
    x: Math.max(0, minX - bleed),
    y: Math.max(0, minY - bleed),
    width: maxX - minX + bleed * 2,
    height: maxY - minY + bleed * 2,
  };
}

async function waitForLayout() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function waitForCaptureStyles(doc: Document) {
  const links = Array.from(
    doc.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  );
  await Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          if (link.sheet) {
            resolve();
            return;
          }
          link.addEventListener('load', () => resolve(), { once: true });
          link.addEventListener('error', () => resolve(), { once: true });
        })
    )
  );
  await doc.fonts.ready;
}

/** Isolated document so Tailwind `dark:` (`&:is(.dark *)`) does not apply. */
async function createLightCaptureDoc() {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error('Could not create capture frame');
  }

  doc.open();
  doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
  doc.close();

  for (const node of document.head.querySelectorAll(
    'link[rel="stylesheet"], style'
  )) {
    doc.head.appendChild(node.cloneNode(true));
  }

  await waitForCaptureStyles(doc);

  doc.documentElement.classList.remove('dark');
  doc.documentElement.style.colorScheme = 'light';
  doc.body.style.margin = '0';
  doc.body.style.background = CAPTURE_BACKGROUND;

  return { iframe, doc };
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function captureBracketPng({
  root,
  width,
  height,
}: CaptureBracketPngOptions): Promise<Blob> {
  await document.fonts.ready;

  const { iframe, doc } = await createLightCaptureDoc();

  const clone = root.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.position = 'absolute';
  clone.style.left = '0';
  clone.style.top = '0';
  applyLightCaptureTheme(clone);
  enforceSlotTruncation(clone);

  const measureHost = doc.createElement('div');
  measureHost.style.position = 'fixed';
  measureHost.style.left = '-10000px';
  measureHost.style.top = '0';
  measureHost.style.visibility = 'hidden';
  measureHost.style.width = `${width}px`;
  measureHost.style.height = `${height}px`;
  measureHost.appendChild(clone);
  doc.body.appendChild(measureHost);

  await waitForLayout();
  const bounds = measureBracketContentBounds(clone);
  measureHost.remove();

  const contentWidth = Math.ceil(bounds.width);
  const contentHeight = Math.ceil(bounds.height);
  const exportWidth = contentWidth + CAPTURE_PAD_X * 2;
  const exportHeight = contentHeight + CAPTURE_PAD_Y * 2;

  const frame = doc.createElement('div');
  frame.className = 'bg-background text-foreground select-none';
  frame.style.width = `${exportWidth}px`;
  frame.style.height = `${exportHeight}px`;
  frame.style.boxSizing = 'border-box';
  frame.style.padding = `${CAPTURE_PAD_Y}px ${CAPTURE_PAD_X}px`;
  frame.style.position = 'relative';
  frame.style.overflow = 'hidden';
  frame.style.backgroundColor = CAPTURE_BACKGROUND;
  applyLightCaptureTheme(frame);
  doc.body.appendChild(frame);

  const crop = doc.createElement('div');
  crop.style.width = `${contentWidth}px`;
  crop.style.height = `${contentHeight}px`;
  crop.style.margin = '0 auto';
  crop.style.position = 'relative';
  crop.style.overflow = 'hidden';

  clone.style.left = `${-bounds.x}px`;
  clone.style.top = `${-bounds.y}px`;

  crop.appendChild(clone);
  frame.appendChild(crop);
  enforceSlotTruncation(frame);

  try {
    const dataUrl = await toPng(frame, {
      width: exportWidth,
      height: exportHeight,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: CAPTURE_BACKGROUND,
      skipAutoScale: true,
    });
    return await dataUrlToBlob(dataUrl);
  } finally {
    iframe.remove();
  }
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
