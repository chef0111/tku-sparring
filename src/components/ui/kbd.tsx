import { cva } from 'class-variance-authority';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Children = ReactNode | Array<ReactNode>;

interface ChildWithProps {
  props?: {
    children?: Children;
  };
}

function extractTextFromChildren(children: Children): string {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children
      .map((child) => extractTextFromChildren(child))
      .filter(Boolean)
      .join('');
  }
  if (isValidElement(children)) {
    return extractTextFromChildren(
      (children as ChildWithProps).props?.children
    );
  }
  if (
    typeof children === 'object' &&
    (children as ChildWithProps)?.props?.children
  ) {
    return extractTextFromChildren(
      (children as ChildWithProps).props!.children
    );
  }
  return '';
}

function formatKbdDisplay(text: string): string {
  return text.replace(/\benter\b/gi, '⏎').replace(/\bcomma\b/gi, ',');
}

function normalizeHotkeyString(str: string | undefined | null): string | null {
  if (!str) return null;
  let normalized = str.trim().toLowerCase();
  normalized = normalized
    .replace(/⌘|cmd|command|meta/gi, 'mod')
    .replace(/ctrl|control/gi, 'ctrl')
    .replace(/alt|option/gi, 'alt')
    .replace(/shift/gi, 'shift')
    .replace(/[\s,-]+/g, '+')
    .replace(/\++/g, '+')
    .replace(/^\+|\+$/g, '');
  return normalized || null;
}

const MODIFIER_KEYS = new Set([
  'mod',
  'ctrl',
  'alt',
  'shift',
  'meta',
  'cmd',
  'command',
]);

function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key.toLowerCase());
}

const kbdVariants = cva(
  'select-none outline-hidden transition-all duration-150',
  {
    variants: {
      variant: {
        default:
          'transform-gpu cursor-pointer rounded-lg border border-neutral-500/50 bg-neutral-300 shadow-[-10px_0px_15px_rgba(255,255,255,1),3px_10px_12.5px_rgba(0,0,0,0.1)] active:shadow-none dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[-10px_0px_15px_rgba(0,0,0,0.3),3px_10px_12.5px_rgba(255,255,255,0.05)]',
        legacy:
          "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium [&_svg:not([class*='size-'])]:size-3 in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const kbdInnerVariants = cva(
  'flex items-center justify-center size-full transform-gpu rounded-[calc(var(--radius)-1px)] transition-all duration-150',
  {
    variants: {
      variant: {
        default:
          '-translate-y-1 z-10 bg-neutral-100 px-3 py-1 text-neutral-500 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.8)] active:translate-y-0 active:shadow-transparent dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-[inset_0px_2px_4px_rgba(255,255,255,0.05)]',
        legacy: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function matchesHotkey(hotkey: string, event: KeyboardEvent): boolean {
  if (!hotkey || !event) return false;

  const parts = hotkey.split('+');
  const lastPart = parts[parts.length - 1].toLowerCase();
  const isOnlyModifier = parts.length === 1 && isModifierKey(lastPart);

  if (isOnlyModifier) {
    if (lastPart === 'mod') {
      return event.metaKey || event.ctrlKey;
    }
    if (lastPart === 'ctrl') {
      return event.ctrlKey;
    }
    if (lastPart === 'alt') {
      return event.altKey;
    }
    if (lastPart === 'shift') {
      return event.shiftKey;
    }
    return false;
  }

  const modifiers = parts.slice(0, -1);
  const key = lastPart;

  const requiresMod = modifiers.includes('mod');
  const requiresCtrl = modifiers.includes('ctrl');
  const requiresAlt = modifiers.includes('alt');
  const requiresShift = modifiers.includes('shift');

  const hasMod = requiresMod ? event.metaKey || event.ctrlKey : true;
  const hasCtrl = requiresCtrl ? event.ctrlKey : true;
  const hasAlt = requiresAlt ? event.altKey : true;
  const hasShift = requiresShift ? event.shiftKey : true;
  const noExtraMods =
    (!requiresMod && !requiresCtrl ? !event.ctrlKey && !event.metaKey : true) &&
    (!requiresAlt ? !event.altKey : true) &&
    (!requiresShift ? !event.shiftKey : true);

  const eventKey = event.key?.toLowerCase() || '';
  const eventCode = event.code?.toLowerCase().replace('key', '') || '';
  const keyMatch = eventKey === key || eventCode === key;
  return hasMod && hasCtrl && hasAlt && hasShift && noExtraMods && keyMatch;
}

interface KbdProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof kbdVariants> {
  useHotkey?: boolean;
  animate?: boolean;
  onHotkeyPress?: (event: KeyboardEvent | ReactKeyboardEvent) => void;
  hotkey?: string;
}

function Kbd({
  className = '',
  variant = 'default',
  useHotkey = false,
  animate = true,
  onHotkeyPress,
  hotkey: hotkeyProp,
  children,
  ...props
}: KbdProps) {
  const [isPressed, setIsPressed] = useState(false);
  const kbdRef = useRef<HTMLElement>(null);

  const extractedText = useMemo(
    () => extractTextFromChildren(children),
    [children]
  );
  const isEscDisplay = !!extractedText && extractedText.toLowerCase() === 'esc';
  const displayText = useMemo(
    () => formatKbdDisplay(extractedText),
    [extractedText]
  );

  const hotkey = useMemo(() => {
    if (!useHotkey) return null;
    if (hotkeyProp) return normalizeHotkeyString(hotkeyProp);
    const text = extractTextFromChildren(children);
    return text ? normalizeHotkeyString(text) : null;
  }, [useHotkey, hotkeyProp, children]);

  const isCompound = useMemo(() => {
    if (hotkey?.includes('+')) return true;
    if (
      hotkeyProp &&
      typeof hotkeyProp === 'string' &&
      hotkeyProp.includes('+')
    )
      return true;
    const text = extractTextFromChildren(children);
    return (
      text?.includes('+') || (Array.isArray(children) && children.length > 1)
    );
  }, [hotkey, hotkeyProp, children]);

  const isSpace = useMemo(() => hotkey === 'space', [hotkey]);

  const handleHotkeyPress = useCallback(
    (event: KeyboardEvent | ReactKeyboardEvent) => {
      event?.preventDefault?.();
      onHotkeyPress?.(event);
    },
    [onHotkeyPress]
  );

  useHotkeys(
    hotkey || '',
    handleHotkeyPress,
    {
      enabled: useHotkey && !!hotkey,
      preventDefault: false,
    },
    [useHotkey, hotkey, handleHotkeyPress]
  );

  useEffect(() => {
    if (!useHotkey || !hotkey || !animate) return;

    const parts = hotkey.split('+');
    const lastPart = parts[parts.length - 1].toLowerCase();
    const isOnlyModifier = parts.length === 1 && isModifierKey(lastPart);
    const mainKey = isOnlyModifier ? null : lastPart;
    const modifierKeys = isOnlyModifier ? parts : parts.slice(0, -1);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesHotkey(hotkey, event)) {
        setIsPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const eventKey = event.key?.toLowerCase() || '';
      const eventCode = event.code?.toLowerCase() || '';

      if (isOnlyModifier) {
        let isModifierUp = false;
        if (lastPart === 'mod') {
          isModifierUp =
            eventKey === 'meta' ||
            eventKey === 'control' ||
            eventCode.includes('meta') ||
            eventCode.includes('control') ||
            (!event.metaKey && !event.ctrlKey);
        } else if (lastPart === 'ctrl') {
          isModifierUp =
            eventKey === 'control' ||
            eventCode.includes('control') ||
            !event.ctrlKey;
        } else if (lastPart === 'alt') {
          isModifierUp =
            eventKey === 'alt' || eventCode.includes('alt') || !event.altKey;
        } else if (lastPart === 'shift') {
          isModifierUp =
            eventKey === 'shift' ||
            eventCode.includes('shift') ||
            !event.shiftKey;
        }

        if (isModifierUp) {
          setIsPressed(false);
        }
      } else {
        const eventCodeMain = eventCode.replace('key', '');

        const isMainKey = eventKey === mainKey || eventCodeMain === mainKey;

        let isModifierUp = false;
        if (modifierKeys.includes('mod')) {
          isModifierUp =
            eventKey === 'meta' ||
            eventKey === 'control' ||
            eventCode.includes('meta') ||
            eventCode.includes('control') ||
            (!event.metaKey && !event.ctrlKey);
        }
        if (modifierKeys.includes('ctrl') && !isModifierUp) {
          isModifierUp =
            eventKey === 'control' ||
            eventCode.includes('control') ||
            !event.ctrlKey;
        }
        if (modifierKeys.includes('alt') && !isModifierUp) {
          isModifierUp =
            eventKey === 'alt' || eventCode.includes('alt') || !event.altKey;
        }
        if (modifierKeys.includes('shift') && !isModifierUp) {
          isModifierUp =
            eventKey === 'shift' ||
            eventCode.includes('shift') ||
            !event.shiftKey;
        }

        if (isMainKey || isModifierUp) {
          setIsPressed(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      setIsPressed(false);
    };
  }, [useHotkey, hotkey, animate]);

  if (variant === 'legacy') {
    return (
      <kbd
        ref={kbdRef}
        data-slot="kbd"
        className={cn(
          kbdVariants({ variant }),
          isEscDisplay && 'size-8',
          className
        )}
        {...props}
      >
        {displayText || children}
      </kbd>
    );
  }

  return (
    <kbd
      ref={kbdRef}
      data-slot="kbd"
      className={cn(
        !isCompound && !isSpace && 'aspect-square',
        isSpace && 'w-24',
        isEscDisplay && 'size-8',
        kbdVariants({ variant }),
        isPressed && 'shadow-none',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          kbdInnerVariants({ variant }),
          isPressed && 'translate-y-0 shadow-transparent'
        )}
      >
        <span className="align-center block text-center text-xs">
          {displayText || children}
        </span>
      </span>
    </kbd>
  );
}

interface KbdGroupProps extends React.HTMLAttributes<HTMLElement> {}

function KbdGroup({ className, ...props }: KbdGroupProps) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    />
  );
}

Kbd.displayName = 'Kbd';
KbdGroup.displayName = 'KbdGroup';

export { Kbd, KbdGroup };
