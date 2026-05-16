import { authClient } from '@/lib/auth-client';
import { useSettings } from '@/contexts/settings';
import { useArenaCombatSnapshotPersistence } from '@/features/app/hooks/use-arena-combat-snapshot-persistence';
import { useArenaLastSelection } from '@/features/app/hooks/use-arena-last-selection';
import { useArenaScoreboardHydration } from '@/features/app/hooks/use-arena-scoreboard-hydration';
import { useMatchSync } from '@/features/app/hooks/use-match-sync';
import { useReplayOnOnline } from '@/features/app/hooks/use-replay-on-online';
import { useRoundSubmit } from '@/features/app/hooks/use-round-submit';

export function AppArenaSideEffects() {
  useArenaLastSelection();
  useArenaScoreboardHydration();
  useArenaCombatSnapshotPersistence();
  useReplayOnOnline();
  useRoundSubmit();

  const { data: session } = authClient.useSession();
  const { formData } = useSettings();

  useMatchSync({
    tournamentId: session?.user ? formData.advance.tournament : null,
    realtimeEnabled: Boolean(session?.user),
  });

  return null;
}
