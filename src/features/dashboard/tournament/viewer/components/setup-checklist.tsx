import { Link } from '@tanstack/react-router';
import { CheckCircle2, Circle } from 'lucide-react';
import type { SetupStep } from '../lib/compute-command-center';
import {
  HubSection,
  HubSectionContent,
} from '@/features/dashboard/home/components/hub-panel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SetupChecklistProps {
  steps: Array<SetupStep>;
  tournamentId: string;
}

export function SetupChecklist({ steps, tournamentId }: SetupChecklistProps) {
  const firstIncompleteIndex = steps.findIndex((step) => !step.complete);

  return (
    <HubSection
      title="Setup checklist"
      description="Complete these steps before activating the tournament"
    >
      <HubSectionContent className="flex flex-col gap-0 p-0">
        <ol className="flex flex-col">
          {steps.map((step, index) => {
            const Icon = step.complete ? CheckCircle2 : Circle;
            const isCurrent = index === firstIncompleteIndex;

            return (
              <li
                key={step.id}
                className={cn(
                  'border-border/50 flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0',
                  isCurrent && 'bg-muted/30'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon
                    className={
                      step.complete
                        ? 'text-primary size-4 shrink-0'
                        : 'text-muted-foreground size-4 shrink-0'
                    }
                    aria-hidden="true"
                  />
                  <span
                    className={
                      step.complete
                        ? 'text-sm'
                        : 'text-muted-foreground text-sm'
                    }
                  >
                    {step.label}
                  </span>
                </div>
                {!step.complete ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto shrink-0 p-0"
                    asChild
                  >
                    <Link
                      to="/dashboard/tournaments/$id/builder"
                      params={{ id: tournamentId }}
                    >
                      Fix in Builder
                    </Link>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ol>
      </HubSectionContent>
    </HubSection>
  );
}
