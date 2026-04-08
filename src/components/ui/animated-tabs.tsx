import React from 'react';

import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { AnimatePresence, motion } from 'motion/react';
import type { Transition } from 'motion/react';

import type { AutoHeightProps } from '@/helpers/effects/auto-height';
import type { HighlightProps } from '@/helpers/effects/highlight';
import { AutoHeight } from '@/helpers/effects/auto-height';
import { Highlight, HighlightItem } from '@/helpers/effects/highlight';
import { getStrictContext } from '@/lib/context/get-strict-context';
import { useControlledState } from '@/hooks/use-controlled-state';
import { cn } from '@/lib/utils';

type TabsValue = string | number | null;

interface TabsContextValue {
  value: TabsValue | undefined;
  setValue: (value: TabsValue, ...args: Array<unknown>) => void;
}

type TabsVariant = 'default' | 'outline' | 'underline';
type TabsDirection = 'horizontal' | 'vertical';
type TabsUnderlinePosition = 'left' | 'right';

interface TabsVariantContextValue {
  variant: TabsVariant;
  orientation: TabsDirection;
  underlinePosition: TabsUnderlinePosition;
}

// --- Internal Primitive Logic ---

const [TabsProvider, useTabs] =
  getStrictContext<TabsContextValue>('TabsContext');

const [TabsDirectionProvider, useTabsDirection] = getStrictContext<{
  orientation: TabsDirection;
}>('TabsDirectionContext');

const [TabsVariantProvider, useTabsVariant] =
  getStrictContext<TabsVariantContextValue>('TabsVariantContext');

interface PrimitiveTabsProps extends Omit<
  React.ComponentProps<typeof BaseTabs.Root>,
  'onValueChange'
> {
  value?: TabsValue;
  defaultValue?: TabsValue;
  onValueChange?: (value: TabsValue, ...args: Array<unknown>) => void;
}

function PrimitiveTabs(props: PrimitiveTabsProps) {
  const [value, setValue] = useControlledState<TabsValue>({
    value: props?.value,
    defaultValue: props?.defaultValue,
    onChange: props?.onValueChange,
  });

  return (
    <TabsProvider value={{ value, setValue }}>
      <BaseTabs.Root data-slot="tabs" {...props} onValueChange={setValue} />
    </TabsProvider>
  );
}

interface PrimitiveTabsHighlightProps extends Omit<HighlightProps, 'value'> {
  transition?: Transition;
}

const UNDERLINE_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
};

function PrimitiveTabsHighlight({
  transition = UNDERLINE_TRANSITION,
  containerClassName,
  ...props
}: PrimitiveTabsHighlightProps = {}) {
  const { value } = useTabs();

  return (
    <Highlight
      data-slot="tabs-highlight"
      controlledItems
      value={value}
      transition={transition}
      click={false}
      containerClassName={containerClassName}
      {...props}
    />
  );
}

type PrimitiveTabsListProps = React.ComponentProps<typeof BaseTabs.List>;

function PrimitiveTabsList(props: PrimitiveTabsListProps = {}) {
  return <BaseTabs.List data-slot="tabs-list" {...props} />;
}

type PrimitiveTabsHighlightItemProps = React.ComponentProps<
  typeof HighlightItem
>;

function PrimitiveTabsHighlightItem(props: PrimitiveTabsHighlightItemProps) {
  return <HighlightItem data-slot="tabs-highlight-item" {...props} />;
}

type PrimitiveTabsTabProps = React.ComponentProps<typeof BaseTabs.Tab>;

function PrimitiveTabsTab(props: PrimitiveTabsTabProps) {
  return <BaseTabs.Tab data-slot="tabs-tab" {...props} />;
}

interface PrimitiveTabsPanelProps extends Omit<
  React.ComponentProps<typeof motion.div>,
  'value'
> {
  value?: TabsValue;
  keepMounted?: boolean;
  transition?: Transition;
}

function PrimitiveTabsPanel({
  value = '',
  keepMounted = true, // Changed default to true for state preservation
  transition = { duration: 0.2, ease: 'easeInOut' },
  ...props
}: PrimitiveTabsPanelProps = {}) {
  const { value: activeValue } = useTabs();
  const isActive = activeValue === value;

  return (
    <BaseTabs.Panel
      render={
        <motion.div
          data-slot="tabs-panel"
          data-active={isActive}
          layout
          layoutDependency={value}
          initial={false} // Prevent initial animation
          animate={{
            opacity: isActive ? 1 : 0,
            filter: isActive ? 'blur(0px)' : 'blur(4px)',
            display: isActive ? 'block' : 'none',
          }}
          transition={transition}
          {...props}
        />
      }
      keepMounted={keepMounted}
      value={value}
    />
  );
}

const DEFAULT_TRANSITION = {
  type: 'spring',
  stiffness: 200,
  damping: 30,
} as const;

type TabsPanelsMode = 'auto-height' | 'layout';

interface PrimitiveTabsPanelsProps extends Omit<
  AutoHeightProps,
  'deps' | 'mode'
> {
  mode?: TabsPanelsMode;
  children?: React.ReactNode;
  transition?: Transition;
  style?: React.CSSProperties;
}

function isAutoMode(props: PrimitiveTabsPanelsProps): boolean {
  return !props.mode || props.mode === 'auto-height';
}

function PrimitiveTabsPanels(props: PrimitiveTabsPanelsProps = {}) {
  const { value } = useTabs();

  if (isAutoMode(props)) {
    const {
      children = null,
      transition = DEFAULT_TRANSITION,
      mode: _mode,
      ...autoProps
    } = props;

    return (
      <AutoHeight
        data-slot="tabs-panels"
        deps={[value]}
        transition={transition}
        {...autoProps}
      >
        {children}
      </AutoHeight>
    );
  }

  const {
    children = null,
    style = {},
    transition = DEFAULT_TRANSITION,
    mode: _mode,
    ...layoutProps
  } = props;

  return (
    <motion.div
      data-slot="tabs-panels"
      layout="size"
      layoutDependency={value}
      transition={{ layout: transition }}
      style={{ overflow: 'hidden', ...style }}
      {...layoutProps}
    >
      {children}
    </motion.div>
  );
}

// --- User-Facing Components ---

const highlightStyles: Record<TabsVariant, Record<TabsDirection, string>> = {
  default: {
    horizontal:
      'absolute z-0 inset-0 border border-transparent rounded-md bg-background dark:border-input dark:bg-input/30 shadow-sm',
    vertical:
      'absolute z-0 inset-0 border border-transparent rounded-md bg-background dark:border-input dark:bg-input/30 shadow-sm',
  },
  outline: {
    horizontal:
      'absolute z-0 inset-0 border rounded-md dark:border-input dark:bg-input/30',
    vertical:
      'absolute z-0 inset-0 border rounded-md dark:border-input dark:bg-input/30',
  },
  underline: {
    horizontal: 'absolute z-0 -bottom-0.25 left-0 right-0 h-0.5 bg-foreground',
    vertical: 'absolute z-0 top-0 bottom-0 w-0.5 bg-foreground',
  },
} as const;

const underlinePositionStyles: Record<
  TabsUnderlinePosition,
  { highlight: string; list: string; gradient: string }
> = {
  right: {
    highlight: '-right-0.25',
    list: 'border-r',
    gradient: 'bg-gradient-to-l from-foreground/10 to-transparent',
  },
  left: {
    highlight: '-left-0.25',
    list: 'border-l',
    gradient: 'bg-gradient-to-r from-foreground/10 to-transparent',
  },
} as const;

const listStyles: Record<TabsVariant, Record<TabsDirection, string>> = {
  default: {
    horizontal:
      'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
    vertical:
      'bg-muted text-muted-foreground inline-flex flex-col h-fit w-fit items-stretch justify-start rounded-lg p-[3px]',
  },
  outline: {
    horizontal:
      'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
    vertical:
      'bg-muted text-muted-foreground inline-flex flex-col h-fit w-fit items-stretch justify-start rounded-lg p-[3px]',
  },
  underline: {
    horizontal:
      'inline-flex h-9 w-fit items-center justify-center gap-1 border-b border-border',
    vertical:
      'inline-flex flex-col h-fit w-fit items-stretch justify-start gap-1 border-border',
  },
} as const;

const triggerStyles: Record<TabsVariant, Record<TabsDirection, string>> = {
  default: {
    horizontal:
      "data-[selected]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md w-full px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-500 ease-in-out focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    vertical:
      "data-[selected]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-muted-foreground inline-flex w-full flex-1 items-center justify-start gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-500 ease-in-out focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  },
  outline: {
    horizontal:
      "data-[selected]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md w-full px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-500 ease-in-out focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    vertical:
      "data-[selected]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-muted-foreground inline-flex w-full flex-1 items-center justify-start gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-500 ease-in-out focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  },
  underline: {
    horizontal:
      "data-[selected]:text-foreground text-muted-foreground inline-flex h-full flex-1 items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    vertical:
      "data-[selected]:text-foreground text-muted-foreground inline-flex w-full flex-1 items-center justify-start gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  },
} as const;

interface TabsProps extends PrimitiveTabsProps {
  className?: string;
  orientation?: TabsDirection;
}

function Tabs({
  className = '',
  orientation = 'horizontal',
  ...props
}: TabsProps = {}) {
  return (
    <TabsDirectionProvider value={{ orientation }}>
      <PrimitiveTabs
        className={cn(
          'flex gap-2',
          orientation === 'horizontal' ? 'flex-col' : 'flex-row',
          className
        )}
        {...props}
      />
    </TabsDirectionProvider>
  );
}

interface TabsListProps extends PrimitiveTabsListProps {
  className?: string;
  variant?: TabsVariant;
  orientation?: TabsDirection;
  underlinePosition?: TabsUnderlinePosition;
}

function TabsList({
  className = '',
  variant = 'default',
  orientation = 'horizontal',
  underlinePosition = 'right',
  ...props
}: TabsListProps = {}) {
  const isVerticalUnderline =
    variant === 'underline' && orientation === 'vertical';
  const positionStyles = isVerticalUnderline
    ? underlinePositionStyles[underlinePosition]
    : null;

  return (
    <TabsVariantProvider value={{ variant, orientation, underlinePosition }}>
      <PrimitiveTabsHighlight
        className={cn(
          highlightStyles[variant][orientation],
          positionStyles?.highlight
        )}
      >
        <PrimitiveTabsList
          className={cn(
            listStyles[variant][orientation],
            positionStyles?.list,
            className
          )}
          {...props}
        />
      </PrimitiveTabsHighlight>
    </TabsVariantProvider>
  );
}

interface TabsTabProps extends Omit<PrimitiveTabsTabProps, 'value'> {
  className?: string;
  value?: TabsValue;
}

function TabsTab({ className = '', value = '', ...props }: TabsTabProps = {}) {
  const { variant, orientation, underlinePosition } = useTabsVariant();
  const { value: selectedValue } = useTabs();
  const isVerticalUnderline =
    variant === 'underline' && orientation === 'vertical';
  const gradientClass = isVerticalUnderline
    ? underlinePositionStyles[underlinePosition].gradient
    : undefined;
  const isSelected = selectedValue === value;

  return (
    <PrimitiveTabsHighlightItem
      value={value}
      className={orientation === 'horizontal' ? 'flex-1' : undefined}
    >
      <div className="relative">
        {isVerticalUnderline && (
          <AnimatePresence>
            {isSelected && (
              <motion.div
                key={String(value)}
                className={cn('absolute inset-0 z-0', gradientClass)}
                initial={{
                  clipPath:
                    underlinePosition === 'right'
                      ? 'inset(0 0 0 100%)'
                      : 'inset(0 100% 0 0)',
                }}
                animate={{ clipPath: 'inset(0 0 0 0)' }}
                exit={{ opacity: 0 }}
                transition={{
                  clipPath: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    delay: 0.1,
                  },
                }}
              />
            )}
          </AnimatePresence>
        )}
        <PrimitiveTabsTab
          value={value}
          className={cn(
            triggerStyles[variant][orientation],
            'relative z-1',
            className
          )}
          {...props}
        />
      </div>
    </PrimitiveTabsHighlightItem>
  );
}

// Aliases for backward compatibility
const TabsTrigger = TabsTab;

interface TabsContentsProps extends PrimitiveTabsPanelsProps {
  className?: string;
}

function TabsContents({ className = '', ...props }: TabsContentsProps = {}) {
  const { orientation } = useTabsDirection();
  return (
    <PrimitiveTabsPanels
      className={cn(orientation === 'vertical' && 'flex-1', className)}
      {...props}
    />
  );
}

const TabsPanels = TabsContents;

interface TabsPanelProps extends PrimitiveTabsPanelProps {
  className?: string;
}

function TabsPanel({ className = '', ...props }: TabsPanelProps = {}) {
  const { orientation } = useTabsDirection();
  return (
    <PrimitiveTabsPanel
      className={cn(
        'outline-none',
        orientation === 'vertical' && 'flex-1',
        className
      )}
      {...props}
    />
  );
}
const TabsContent = TabsPanel;

Tabs.displayName = 'Tabs';
TabsList.displayName = 'TabsList';
TabsTab.displayName = 'TabsTab';
TabsTrigger.displayName = 'TabsTrigger';
TabsPanel.displayName = 'TabsPanel';
TabsContent.displayName = 'TabsContent';

export {
  Tabs,
  TabsList,
  TabsTab,
  TabsTrigger,
  TabsPanels,
  TabsContents,
  TabsPanel,
  TabsContent,
};
