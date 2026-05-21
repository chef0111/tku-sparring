import { Link } from '@tanstack/react-router';
import { CheckCircle2, Circle } from 'lucide-react';
import type { SetupStep } from '../lib/compute-command-center';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SetupChecklistProps {
  steps: Array<SetupStep>;
  tournamentId: string;
}

export function SetupChecklist({ steps, tournamentId }: SetupChecklistProps) {
  const firstIncompleteIndex = steps.findIndex((step) => !step.complete);

  return (
    <Card className="bg-card rounded-lg border">
      <CardContent className="flex flex-wrap items-center gap-4 pt-6">
        {steps.map((step, index) => {
          const Icon = step.complete ? CheckCircle2 : Circle;
          const isCurrent = index === firstIncompleteIndex;

          return (
            <div
              key={step.id}
              className="flex items-center gap-2"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <Icon
                className={
                  step.complete
                    ? 'text-primary size-4'
                    : 'text-muted-foreground size-4'
                }
              />
              <span
                className={
                  step.complete ? 'text-sm' : 'text-muted-foreground text-sm'
                }
              >
                {step.label}
              </span>
              {!step.complete ? (
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link
                    to="/dashboard/tournaments/$id/builder"
                    params={{ id: tournamentId }}
                  >
                    Fix in Builder
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
