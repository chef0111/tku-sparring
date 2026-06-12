import { Link } from '@tanstack/react-router';
import {
  ArrowUpRight,
  Check,
  GitBranch,
  Layers,
  ListChecks,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SetupStep } from '../lib/compute-command-center';
import {
  HubMetricFooter,
  HubSection,
  HubSectionContent,
} from '@/features/dashboard/home/components/hub-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { cn } from '@/lib/utils';

interface SetupChecklistProps {
  steps: Array<SetupStep>;
  tournamentId: string;
}

const STEP_ICONS: Record<SetupStep['id'], LucideIcon> = {
  athletes: Users,
  groups: Layers,
  brackets: GitBranch,
};

function getProgressCopy(completedCount: number, total: number) {
  if (completedCount === total) {
    return 'All setup steps complete — activate when you are ready to go live.';
  }

  if (completedCount === 0) {
    return 'Start with the athlete pool, then build out divisions and brackets.';
  }

  return 'Complete the remaining steps before activating the tournament.';
}

function StepStatusBadge({
  complete,
  isCurrent,
}: {
  complete: boolean;
  isCurrent: boolean;
}) {
  if (complete) {
    return (
      <Status status="online" className="gap-1.5 bg-transparent p-0 pl-1">
        <StatusIndicator />
        <StatusLabel className="text-xs font-medium">Complete</StatusLabel>
      </Status>
    );
  }

  if (isCurrent) {
    return (
      <Status status="maintenance" className="gap-1.5 bg-transparent p-0 pl-1">
        <StatusIndicator />
        <StatusLabel className="text-xs font-medium">Next up</StatusLabel>
      </Status>
    );
  }

  return (
    <Status status="degraded" className="gap-1.5 bg-transparent p-0 pl-1">
      <StatusIndicator />
      <StatusLabel className="text-xs font-medium">Pending</StatusLabel>
    </Status>
  );
}

function SetupStepRow({
  step,
  index,
  isCurrent,
  isLast,
  tournamentId,
}: {
  step: SetupStep;
  index: number;
  isCurrent: boolean;
  isLast: boolean;
  tournamentId: string;
}) {
  const Icon = STEP_ICONS[step.id];

  return (
    <li
      className={cn('relative flex gap-3', !isLast && 'pb-3')}
      aria-current={isCurrent ? 'step' : undefined}
    >
      <div className="relative flex w-5 shrink-0 translate-y-[25px] flex-col items-center">
        <div
          aria-hidden
          className={cn(
            'relative z-10 flex size-5 items-center justify-center rounded-full border transition-colors',
            step.complete
              ? 'border-primary/30 bg-primary/10 text-primary'
              : isCurrent
                ? 'border-primary bg-primary/15 text-primary ring-primary/20 ring-2'
                : 'border-border bg-muted text-muted-foreground'
          )}
        >
          {step.complete ? (
            <Check className="size-3" strokeWidth={2.5} />
          ) : (
            <span className="text-[10px] font-semibold tabular-nums">
              {index + 1}
            </span>
          )}
        </div>
        {!isLast && (
          <div
            aria-hidden
            className={cn(
              'absolute top-5 -bottom-3 left-1/2 w-px -translate-x-1/2',
              step.complete ? 'bg-primary/30' : 'bg-border'
            )}
          />
        )}
      </div>

      <article
        className={cn(
          'border-border/60 bg-card/40 flex min-w-0 flex-1 flex-col gap-3 rounded-lg border p-3 shadow-sm transition-colors',
          isCurrent && 'border-primary/25 bg-muted/30 shadow-sm',
          step.complete && 'opacity-90'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="border-muted-foreground/15 bg-muted ring-border ring-offset-background [&_svg]:text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md border ring-1 ring-offset-1 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5">
              <Icon aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-x-3">
                <h3
                  className={cn(
                    'text-sm font-medium',
                    step.complete && 'text-primary'
                  )}
                >
                  {step.label}
                </h3>
                <StepStatusBadge
                  complete={step.complete}
                  isCurrent={isCurrent}
                />
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
            {step.metric}
          </span>
        </div>

        {!step.complete ? (
          <div className="flex justify-end">
            <Button
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              className="h-8 cursor-pointer"
              asChild
            >
              <Link
                to="/dashboard/tournaments/$id/builder"
                params={{ id: tournamentId }}
                search={{
                  tab: step.builderTab,
                  ...(step.id === 'athletes' ? { addAthletes: true } : {}),
                }}
              >
                {step.ctaLabel}
                <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : null}
      </article>
    </li>
  );
}

export function SetupChecklist({ steps, tournamentId }: SetupChecklistProps) {
  const completedCount = steps.filter((step) => step.complete).length;
  const total = steps.length;
  const progressValue = total === 0 ? 0 : (completedCount / total) * 100;
  const firstIncompleteIndex = steps.findIndex((step) => !step.complete);
  const allComplete = completedCount === total;

  return (
    <HubSection
      title="Pre-activation setup"
      description={getProgressCopy(completedCount, total)}
      action={
        <Badge variant="secondary" className="font-mono tabular-nums">
          {completedCount}/{total}
        </Badge>
      }
    >
      <HubSectionContent className="flex flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="size-3.5" aria-hidden="true" />
              Setup progress
            </span>
            <span className="text-foreground font-medium tabular-nums">
              {Math.round(progressValue)}%
            </span>
          </div>
          <Progress value={progressValue} aria-label="Setup progress" />
        </div>

        <ol className="flex flex-col" role="list">
          {steps.map((step, index) => (
            <SetupStepRow
              key={step.id}
              step={step}
              index={index}
              isCurrent={index === firstIncompleteIndex}
              isLast={index === steps.length - 1}
              tournamentId={tournamentId}
            />
          ))}
        </ol>

        {allComplete && (
          <HubMetricFooter
            status="online"
            value="Ready"
            label="to activate from the header when you are set"
          />
        )}
      </HubSectionContent>
    </HubSection>
  );
}
