import { authClient } from '@/lib/auth-client';
import { useSettings } from '@/contexts/settings';
import { useArenaLastSelection } from '@/features/app/hooks/use-arena-last-selection';
import { useMatchSync } from '@/features/app/hooks/use-match-sync';
import { useReplayOnOnline } from '@/features/app/hooks/use-replay-on-online';
import { useRoundSubmit } from '@/features/app/hooks/use-round-submit';

export function AppArenaSideEffects() {
  useArenaLastSelection();
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
