import * as React from 'react';

export type ScrollActiveTargetRegisterFn = (
  id: string,
  el: HTMLElement | null
) => void;

export interface UseScrollActiveIntoViewOptions {
  /** Id of the element that should be scrolled into view when `rerollKey` changes. */
  activeId: string | null | undefined;
  /**
   * When this value changes (by `Object.is`), the active target is scrolled again.
   * Use a stable string key so parent array identity does not retrigger unnecessarily.
   */
  rerollKey: unknown;
  /** If false, the layout effect is skipped. Defaults to true. */
  enabled?: boolean;
  /** Passed to `scrollIntoView`. Defaults to `nearest`. */
  block?: ScrollLogicalPosition;
  /** Passed to `scrollIntoView`. Defaults to `center` for horizontal tab strips. */
  inline?: ScrollLogicalPosition;
}

export interface UseScrollActiveIntoViewResult {
  /** Attach to each scroll target; call with `null` on unmount. */
  register: ScrollActiveTargetRegisterFn;
  /** Scroll a registered id into view on the next frame (e.g. after a controlled tab change). */
  scrollIdIntoView: (id: string) => void;
}

/**
 * Keeps a map of element ids → DOM nodes and scrolls the active id into view
 * after layout when `activeId` or `rerollKey` changes (URL sync, refresh, list updates).
 */
export function useScrollActiveIntoView(
  options: UseScrollActiveIntoViewOptions
): UseScrollActiveIntoViewResult {
  const {
    activeId,
    rerollKey,
    enabled = true,
    block = 'nearest',
    inline = 'center',
  } = options;

  const elementsRef = React.useRef(new Map<string, HTMLElement>());

  const register = React.useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      elementsRef.current.set(id, el);
    } else {
      elementsRef.current.delete(id);
    }
  }, []);

  const scrollIdIntoView = React.useCallback(
    (id: string) => {
      requestAnimationFrame(() => {
        elementsRef.current.get(id)?.scrollIntoView({ block, inline });
      });
    },
    [block, inline]
  );

  React.useEffect(() => {
    if (!enabled || !activeId) return;
    const el = elementsRef.current.get(activeId);
    if (!el) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          el.scrollIntoView({ block, inline });
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [activeId, rerollKey, enabled, block, inline]);

  return { register, scrollIdIntoView };
}
