import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Transition } from 'motion/react';

import { cn } from '@/lib/utils';

type PolymorphicContainer = React.ComponentType<
  React.PropsWithChildren<
    React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
  >
>;

export type HighlightValue = string | number | null;

export interface BoundsOffset {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

export interface Bounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HighlightContextValue {
  mode: 'children' | 'parent';
  activeValue: HighlightValue;
  setActiveValue: (id: HighlightValue) => void;
  id: string;
  hover: boolean;
  click: boolean;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
  disabled: boolean;
  enabled: boolean;
  exitDelay?: number;
  setBounds: (bounds: DOMRect) => void;
  clearBounds: () => void;
  activeClassName: string;
  setActiveClassName: (className: string) => void;
  forceUpdateBounds?: boolean;
}

const HighlightContext = React.createContext<HighlightContextValue | undefined>(
  undefined
);

function useHighlight(): HighlightContextValue {
  const context = useContext(HighlightContext);
  if (!context) {
    throw new Error('useHighlight must be used within a HighlightProvider');
  }
  return context;
}

export interface HighlightProps {
  ref?: React.Ref<HTMLElement>;
  as?: React.ElementType;
  children?: React.ReactNode;
  value?: HighlightValue;
  defaultValue?: HighlightValue;
  onValueChange?: (value: HighlightValue) => void;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
  hover?: boolean;
  click?: boolean;
  enabled?: boolean;
  controlledItems?: boolean;
  disabled?: boolean;
  exitDelay?: number;
  mode?: 'children' | 'parent';
  boundsOffset?: BoundsOffset;
  containerClassName?: string;
  itemsClassName?: string;
  forceUpdateBounds?: boolean;
}

function Highlight({ ref, ...props }: HighlightProps) {
  const {
    as: ComponentProp = 'div',
    children,
    value,
    defaultValue,
    onValueChange,
    className,
    style,
    transition = { type: 'spring', stiffness: 350, damping: 35 },
    hover = false,
    click = true,
    enabled = true,
    controlledItems,
    disabled = false,
    exitDelay = 200,
    mode = 'children',
  } = props;

  const Component = ComponentProp as PolymorphicContainer;

  const localRef = React.useRef<HTMLElement>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLElement);

  const [activeValue, setActiveValue] = useState<HighlightValue>(
    value ?? defaultValue ?? null
  );
  const [boundsState, setBoundsState] = useState<Bounds | null>(null);
  const [activeClassNameState, setActiveClassNameState] = useState('');

  const safeSetActiveValue = useCallback(
    (id: HighlightValue) => {
      setActiveValue((prev) => {
        if (prev === id) return prev;
        onValueChange?.(id);
        return id;
      });
    },
    [onValueChange]
  );

  const safeSetBounds = useCallback(
    (bounds: DOMRect) => {
      if (!localRef.current) return;

      const boundsOffset = props?.boundsOffset ?? {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      };

      const containerRect = localRef.current.getBoundingClientRect();
      const newBounds: Bounds = {
        top: bounds.top - containerRect.top + (boundsOffset.top ?? 0),
        left: bounds.left - containerRect.left + (boundsOffset.left ?? 0),
        width: bounds.width + (boundsOffset.width ?? 0),
        height: bounds.height + (boundsOffset.height ?? 0),
      };

      setBoundsState((prev) => {
        if (
          prev &&
          prev.top === newBounds.top &&
          prev.left === newBounds.left &&
          prev.width === newBounds.width &&
          prev.height === newBounds.height
        ) {
          return prev;
        }
        return newBounds;
      });
    },
    [props]
  );

  const clearBounds = useCallback(() => {
    setBoundsState((prev) => (prev === null ? prev : null));
  }, []);

  useEffect(() => {
    if (value !== undefined) setActiveValue(value);
    else if (defaultValue !== undefined) setActiveValue(defaultValue);
  }, [value, defaultValue]);

  const id = React.useId();

  useEffect(() => {
    if (mode !== 'parent') return;
    const container = localRef.current;
    if (!container) return;

    const onScroll = () => {
      if (!activeValue) return;
      const activeEl = container.querySelector(
        `[data-value="${activeValue}"][data-highlight="true"]`
      );
      if (activeEl) safeSetBounds(activeEl.getBoundingClientRect());
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [mode, activeValue, safeSetBounds]);

  const render = useCallback(
    (renderChildren: React.ReactNode) => {
      if (mode === 'parent') {
        return (
          <Component
            ref={localRef}
            data-slot="motion-highlight-container"
            style={{ position: 'relative', zIndex: 1 }}
            className={props?.containerClassName}
          >
            <AnimatePresence initial={false} mode="wait">
              {boundsState && (
                <motion.div
                  data-slot="motion-highlight"
                  animate={{
                    top: boundsState.top,
                    left: boundsState.left,
                    width: boundsState.width,
                    height: boundsState.height,
                    opacity: 1,
                  }}
                  initial={{
                    top: boundsState.top,
                    left: boundsState.left,
                    width: boundsState.width,
                    height: boundsState.height,
                    opacity: 0,
                  }}
                  exit={{
                    opacity: 0,
                    transition: {
                      ...transition,
                      delay: (transition?.delay ?? 0) + (exitDelay ?? 0) / 1000,
                    },
                  }}
                  transition={transition}
                  style={{ position: 'absolute', zIndex: 0, ...style }}
                  className={cn(className, activeClassNameState)}
                />
              )}
            </AnimatePresence>
            {renderChildren}
          </Component>
        );
      }

      return renderChildren;
    },
    [
      mode,
      Component,
      props,
      boundsState,
      transition,
      exitDelay,
      style,
      className,
      activeClassNameState,
    ]
  );

  return (
    <HighlightContext.Provider
      value={{
        mode,
        activeValue,
        setActiveValue: safeSetActiveValue,
        id,
        hover,
        click,
        className,
        style,
        transition,
        disabled,
        enabled,
        exitDelay,
        setBounds: safeSetBounds,
        clearBounds,
        activeClassName: activeClassNameState,
        setActiveClassName: setActiveClassNameState,
        forceUpdateBounds: props?.forceUpdateBounds,
      }}
    >
      {enabled
        ? controlledItems
          ? render(children)
          : render(
              React.Children.map(children, (child, index) =>
                React.isValidElement<HighlightItemChildProps>(child) ? (
                  <HighlightItem key={index} className={props?.itemsClassName}>
                    {child}
                  </HighlightItem>
                ) : null
              )
            )
        : children}
    </HighlightContext.Provider>
  );
}

interface ElementWithProps {
  props: Record<string, unknown>;
}

function getNonOverridingDataAttributes(
  element: ElementWithProps,
  dataAttributes: Record<string, unknown>
): Record<string, unknown> {
  return Object.keys(dataAttributes).reduce(
    (acc, key) => {
      if (element.props[key] === undefined) {
        acc[key] = dataAttributes[key];
      }
      return acc;
    },
    {} as Record<string, unknown>
  );
}

export interface HighlightItemChildProps {
  id?: string;
  'data-value'?: HighlightValue;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
  onClick?: React.MouseEventHandler;
  [key: string]: unknown;
}

export interface HighlightItemProps {
  ref?: React.Ref<HTMLElement>;
  as?: React.ElementType;
  children: React.ReactElement<HighlightItemChildProps>;
  id?: HighlightValue;
  value?: HighlightValue;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
  disabled?: boolean;
  activeClassName?: string;
  exitDelay?: number;
  asChild?: boolean;
  forceUpdateBounds?: boolean;
}

function HighlightItem({
  ref,
  as,
  children,
  id,
  value,
  className,
  style,
  transition,
  disabled = false,
  activeClassName,
  exitDelay,
  asChild = false,
  forceUpdateBounds,
  ...props
}: HighlightItemProps) {
  const itemId = useId();
  const {
    activeValue,
    setActiveValue,
    mode,
    setBounds,
    clearBounds,
    hover,
    click,
    enabled,
    className: contextClassName,
    style: contextStyle,
    transition: contextTransition,
    id: contextId,
    disabled: contextDisabled,
    exitDelay: contextExitDelay,
    forceUpdateBounds: contextForceUpdateBounds,
    setActiveClassName,
  } = useHighlight();

  const Component = (as ?? 'div') as PolymorphicContainer;
  const element = children;
  const childValue: HighlightValue =
    id ?? value ?? element.props?.['data-value'] ?? element.props?.id ?? itemId;
  const isActive = activeValue === childValue;
  const isDisabled = disabled === undefined ? contextDisabled : disabled;
  const itemTransition = transition ?? contextTransition;

  const localRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLElement);

  useEffect(() => {
    if (mode !== 'parent') return;
    let rafId: number;
    let previousBounds: DOMRect | null = null;
    const shouldUpdateBounds =
      forceUpdateBounds === true ||
      (contextForceUpdateBounds && forceUpdateBounds !== false);

    const updateBounds = () => {
      if (!localRef.current) return;

      const bounds = localRef.current.getBoundingClientRect();

      if (shouldUpdateBounds) {
        if (
          previousBounds &&
          previousBounds.top === bounds.top &&
          previousBounds.left === bounds.left &&
          previousBounds.width === bounds.width &&
          previousBounds.height === bounds.height
        ) {
          rafId = requestAnimationFrame(updateBounds);
          return;
        }
        previousBounds = bounds;
        rafId = requestAnimationFrame(updateBounds);
      }

      setBounds(bounds);
    };

    if (isActive) {
      updateBounds();
      setActiveClassName(activeClassName ?? '');
    } else if (!activeValue) clearBounds();

    if (shouldUpdateBounds) return () => cancelAnimationFrame(rafId);
  }, [
    mode,
    isActive,
    activeValue,
    setBounds,
    clearBounds,
    activeClassName,
    setActiveClassName,
    forceUpdateBounds,
    contextForceUpdateBounds,
  ]);

  if (!React.isValidElement(children)) return children;

  const dataAttributes = {
    'data-active': isActive ? 'true' : 'false',
    'aria-selected': isActive,
    'data-disabled': isDisabled,
    'data-value': childValue,
    'data-highlight': true,
  };

  const commonHandlers = hover
    ? {
        onMouseEnter: (e: React.MouseEvent) => {
          setActiveValue(childValue);
          element.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          setActiveValue(null);
          element.props.onMouseLeave?.(e);
        },
      }
    : click
      ? {
          onClick: (e: React.MouseEvent) => {
            setActiveValue(childValue);
            element.props.onClick?.(e);
          },
        }
      : {};

  if (asChild) {
    if (mode === 'children') {
      return React.cloneElement(
        element,
        {
          key: childValue,
          ref: localRef,
          className: cn('relative', element.props.className),
          ...getNonOverridingDataAttributes(element, {
            ...dataAttributes,
            'data-slot': 'motion-highlight-item-container',
          }),
          ...commonHandlers,
          ...props,
        },
        <>
          <AnimatePresence initial={false} mode="wait">
            {isActive && !isDisabled && (
              <motion.div
                layoutId={`transition-background-${contextId}`}
                data-slot="motion-highlight"
                style={{
                  position: 'absolute',
                  zIndex: 0,
                  ...contextStyle,
                  ...style,
                }}
                className={cn(contextClassName, activeClassName)}
                transition={itemTransition}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: {
                    ...itemTransition,
                    delay:
                      (itemTransition?.delay ?? 0) +
                      (exitDelay ?? contextExitDelay ?? 0) / 1000,
                  },
                }}
                {...dataAttributes}
              />
            )}
          </AnimatePresence>

          <Component
            data-slot="motion-highlight-item"
            style={{ position: 'relative', zIndex: 1 }}
            className={className}
            {...dataAttributes}
          >
            {children}
          </Component>
        </>
      );
    }

    return React.cloneElement(element, {
      ref: localRef,
      ...getNonOverridingDataAttributes(element, {
        ...dataAttributes,
        'data-slot': 'motion-highlight-item',
      }),
      ...commonHandlers,
    });
  }

  return enabled ? (
    <Component
      key={childValue}
      ref={localRef}
      data-slot="motion-highlight-item-container"
      className={cn(mode === 'children' && 'relative', className)}
      {...dataAttributes}
      {...(props as React.HTMLAttributes<HTMLElement>)}
      {...commonHandlers}
    >
      {mode === 'children' && (
        <AnimatePresence initial={false} mode="wait">
          {isActive && !isDisabled && (
            <motion.div
              layoutId={`transition-background-${contextId}`}
              data-slot="motion-highlight"
              style={{
                position: 'absolute',
                zIndex: 0,
                ...contextStyle,
                ...style,
              }}
              className={cn(contextClassName, activeClassName)}
              transition={itemTransition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: {
                  ...itemTransition,
                  delay:
                    (itemTransition?.delay ?? 0) +
                    (exitDelay ?? contextExitDelay ?? 0) / 1000,
                },
              }}
              {...dataAttributes}
            />
          )}
        </AnimatePresence>
      )}

      {React.cloneElement(element, {
        style: { position: 'relative', zIndex: 1 },
        className: element.props.className,
        ...getNonOverridingDataAttributes(element, {
          ...dataAttributes,
          'data-slot': 'motion-highlight-item',
        }),
      })}
    </Component>
  ) : (
    children
  );
}

export { Highlight, HighlightItem, useHighlight };
