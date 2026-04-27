import { useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import type { TournamentListItem } from '@/features/dashboard/types';
import { DecorIcon } from '@/components/ui/decor-icon';
import { CanvasReveal } from '@/components/ui/canvas-reveal';
import { Button } from '@/components/ui/button';

interface TournamentCardProps {
  tournament: TournamentListItem;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="bg-[radial-gradient(35%_80%_at_25%_0%,--theme(--color-foreground/.08),transparent)] group relative flex min-h-64 flex-col items-center justify-center border-2 bg-transparent px-4 py-6"
    >
      <DecorIcon className="size-5" position="top-left" />
      <DecorIcon className="size-5" position="top-right" />
      <DecorIcon className="size-5" position="bottom-left" />
      <DecorIcon className="size-5" position="bottom-right" />

      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 h-full w-full"
          >
            <CanvasReveal
              animationSpeed={3}
              containerClassName="bg-background"
              colors={[
                [125, 211, 252],
                [0, 131, 255],
              ]}
              dotSize={2}
            />
            <div className="absolute inset-0 bg-black/80 mask-[radial-gradient(400px_at_center,white,transparent)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="z-20 flex flex-col items-center justify-center gap-4 shadow-md">
        <div className="bg-primary/10 ring-primary/10 flex size-10 items-center justify-center rounded-lg border backdrop-blur-xs transition duration-200 group-hover:-translate-y-2 group-hover:ring-3">
          <Trophy className="text-primary size-5" />
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 transition duration-200 group-hover:-translate-y-2">
          <h4 className="truncate text-lg font-semibold transition-colors">
            {tournament.name}
          </h4>
          <p className="text-muted-foreground text-xs tracking-wider">
            {tournament._count.groups} groups <b>&middot;</b>{' '}
            {tournament._count.athletes} athletes <b>&middot;</b>{' '}
            {tournament._count.matches} matches
          </p>
        </div>

        <div className="relative flex h-8 items-center justify-center">
          <Button
            className="z-10 -translate-y-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-white"
            asChild
          >
            <Link
              to="/dashboard/tournaments/$id"
              params={{ id: tournament.id }}
            >
              View Tournament
              <ArrowRight />
            </Link>
          </Button>
          <p className="text-muted-foreground absolute bottom-0 text-xs transition duration-200 group-hover:translate-y-6 group-hover:opacity-0">
            {new Date(tournament.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
