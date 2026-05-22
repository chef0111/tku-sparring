import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';
import type { StatusProps } from '@/components/ui/status';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { cn } from '@/lib/utils';

interface HubMetricFooterProps {
  status: StatusProps['status'];
  value: string;
  label: string;
}

export function HubMetricFooter({
  status,
  value,
  label,
}: HubMetricFooterProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-1 text-xs">
      <Status status={status} className="gap-1.5 bg-transparent p-0">
        <StatusIndicator />
        <StatusLabel className="text-foreground font-medium tabular-nums">
          {value}
        </StatusLabel>
      </Status>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

interface HubMetricCardProps {
  label: string;
  icon: LucideIcon;
  value: React.ReactNode;
  footer?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function HubMetricCard({
  label,
  icon: Icon,
  value,
  footer,
  action,
  className,
  style,
}: HubMetricCardProps) {
  return (
    <Card
      className={cn(
        'group bg-card border-border/80 relative gap-0 overflow-visible border border-b-0 p-0 ring-0',
        className
      )}
      style={style}
    >
      {action ? (
        <div className="absolute top-1 right-2 z-20 p-0">{action}</div>
      ) : null}
      <CardHeader className="relative z-0 flex w-full min-w-0 items-center gap-2 px-3 py-2">
        <div className="border-muted-foreground/15 bg-muted ring-border ring-offset-background [&_svg]:text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-sm border ring-1 ring-offset-1 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3">
          <Icon className="text-muted-foreground" aria-hidden="true" />
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {label}
        </span>
      </CardHeader>
      <CardContent className="bg-background border-border ring-border relative z-10 -mx-0.75 mt-auto flex w-[calc(100%+0.375rem)] max-w-none flex-col justify-between gap-2 overflow-hidden rounded-xl p-4 shadow-sm ring before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:bg-[radial-gradient(ellipse_90%_70%_at_0%_0%,rgb(255_255_255/0.12),transparent_58%)] before:content-['']">
        <p className="relative z-1 text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {footer ? (
          <div className="relative z-1 mt-3 min-w-0">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface HubSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function HubSection({
  title,
  description,
  action,
  children,
  className,
}: HubSectionProps) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-medium">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="bg-card ring-foreground/6 overflow-hidden rounded-xl ring-1">
        {children}
      </div>
    </section>
  );
}

interface HubSectionBodyProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export function HubSectionBody({
  children,
  className,
  padded = true,
}: HubSectionBodyProps) {
  return <div className={cn(padded && 'p-4', className)}>{children}</div>;
}

interface HubSectionHeaderProps {
  title: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export function HubSectionHeader({
  title,
  trailing,
  className,
}: HubSectionHeaderProps) {
  return (
    <div
      className={cn(
        'border-border/50 flex items-center justify-between gap-3 border-b px-4 py-3',
        className
      )}
    >
      <div className="min-w-0">{title}</div>
      {trailing}
    </div>
  );
}
