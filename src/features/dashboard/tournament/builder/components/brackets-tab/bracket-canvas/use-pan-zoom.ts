import * as React from 'react';

const SCALE_MIN = 0.25;
const SCALE_MAX = 2.5;

export function usePanZoom() {
  const [transform, setTransform] = React.useState({ x: 0, y: 0, scale: 1 });
  const transformRef = React.useRef(transform);
  transformRef.current = transform;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const panRef = React.useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const reset = React.useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
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
