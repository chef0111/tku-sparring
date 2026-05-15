import { authClient } from '@/lib/auth-client';
import { useDeviceId } from '@/hooks/use-device-id';
import { useSettings } from '@/contexts/settings';
import { useArenaLastSelection } from '@/features/app/hooks/use-arena-last-selection';
import { useMatchSync } from '@/features/app/hooks/use-match-sync';
import { useReplayOnOnline } from '@/features/app/hooks/use-replay-on-online';
import { useRoundSubmit } from '@/features/app/hooks/use-round-submit';

export function AppArenaSideEffects() {
  useArenaLastSelection();
  useReplayOnOnline();
  useRoundSubmit();

  const deviceId = useDeviceId();
  const { data: session } = authClient.useSession();
  const { formData } = useSettings();

  useMatchSync({
    tournamentId: session?.user ? formData.advance.tournament : null,
    deviceId: session?.user ? deviceId : undefined,
    claimMatchId: session?.user ? (formData.advance.match ?? null) : null,
    realtimeEnabled: Boolean(session?.user),
  });

  return null;
}
