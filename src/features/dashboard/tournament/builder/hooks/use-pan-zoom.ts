import * as React from 'react';

const SCALE_MIN = 0.25;
const SCALE_MAX = 2.5;

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

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function centerView() {
      const node = containerRef.current;
      const { w, h } = contentDimsRef.current;
      setTransform((t) => {
        if (!node || w <= 0 || h <= 0) return t;
        const rect = node.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        if (W <= 0 || H <= 0) return t;
        return {
          ...t,
          x: W / 2 - (w * t.scale) / 2,
          y: H / 2 - (h * t.scale) / 2,
        };
      });
    }

    centerView();
    const ro = new ResizeObserver(centerView);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentWidth, contentHeight]);

  const reset = React.useCallback(() => {
    setTransform(() => {
      const el = containerRef.current;
      const { w, h } = contentDimsRef.current;
      const scale = 1;
      if (!el || w <= 0 || h <= 0) {
        return { x: 0, y: 0, scale };
      }
      const rect = el.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      return {
        scale,
        x: W / 2 - w / 2,
        y: H / 2 - h / 2,
      };
    });
  }, []);

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
