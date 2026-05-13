import * as React from 'react';

const SCALE_MIN = 0.25;
const SCALE_MAX = 2.5;
const PAD = 32;
const UPSCALE_CAP = 1.25;

function fitScale(w: number, h: number, W: number, H: number): number {
  if (w <= 0 || h <= 0 || W <= 0 || H <= 0) return 1;
  const raw = Math.min((W - PAD) / w, (H - PAD) / h);
  const s = Math.min(raw, UPSCALE_CAP, SCALE_MAX);
  return Math.max(SCALE_MIN, s);
}

function centerForScale(
  w: number,
  h: number,
  W: number,
  H: number,
  scale: number
): { x: number; y: number } {
  return {
    x: W / 2 - (w * scale) / 2,
    y: H / 2 - (h * scale) / 2,
  };
}

/**
 * @param contentWidth - Bracket layout width (px)
 * @param contentHeight - Bracket layout height (px)
 */
export function usePanZoom(contentWidth: number, contentHeight: number) {
  const [transform, setTransform] = React.useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  const transformRef = React.useRef(transform);
  transformRef.current = transform;

  const contentDimsRef = React.useRef({
    w: contentWidth,
    h: contentHeight,
  });
  contentDimsRef.current = { w: contentWidth, h: contentHeight };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const panRef = React.useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const applyFitTransform = React.useCallback(() => {
    const node = containerRef.current;
    const { w, h } = contentDimsRef.current;
    if (!node || w <= 0 || h <= 0) return;
    const rect = node.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (W <= 0 || H <= 0) return;
    const scale = fitScale(w, h, W, H);
    const { x, y } = centerForScale(w, h, W, H, scale);
    setTransform({ x, y, scale });
  }, []);

  const recenterTransform = React.useCallback(() => {
    const node = containerRef.current;
    const { w, h } = contentDimsRef.current;
    if (!node || w <= 0 || h <= 0) return;
    const rect = node.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (W <= 0 || H <= 0) return;
    setTransform((t) => ({
      ...t,
      ...centerForScale(w, h, W, H, t.scale),
    }));
  }, []);

  React.useLayoutEffect(() => {
    applyFitTransform();
  }, [contentWidth, contentHeight, applyFitTransform]);

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recenterTransform);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recenterTransform]);

  const reset = React.useCallback(() => {
    applyFitTransform();
  }, [applyFitTransform]);

  const zoomIn = React.useCallback(() => {
    setTransform((t) => ({
      ...t,
      scale: Math.min(SCALE_MAX, t.scale * 1.15),
    }));
  }, []);

  const zoomOut = React.useCallback(() => {
    setTransform((t) => ({
      ...t,
      scale: Math.max(SCALE_MIN, t.scale / 1.15),
    }));
  }, []);

  const onWheel = React.useCallback((e: WheelEvent) => {
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY * 0.001;
    setTransform((prev) => {
      const nextScale = Math.min(
        SCALE_MAX,
        Math.max(SCALE_MIN, prev.scale * (1 + delta))
      );
      const k = nextScale / prev.scale;
      const nextX = mx - (mx - prev.x) * k;
      const nextY = my - (my - prev.y) * k;
      return { x: nextX, y: nextY, scale: nextScale };
    });
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-bracket-slot]')) return;
      const t = transformRef.current;
      panRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        originX: t.x,
        originY: t.y,
      };
    },
    []
  );

  React.useEffect(() => {
    function onMove(e: MouseEvent) {
      const p = panRef.current;
      if (!p?.active) return;
      setTransform((t) => ({
        ...t,
        x: p.originX + (e.clientX - p.startX),
        y: p.originY + (e.clientY - p.startY),
      }));
    }
    function onUp() {
      if (panRef.current) panRef.current.active = false;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const handlers = React.useMemo(
    () => ({
      onMouseDown,
    }),
    [onMouseDown]
  );

  return { containerRef, transform, handlers, reset, zoomIn, zoomOut };
}
