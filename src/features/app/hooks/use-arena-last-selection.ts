import * as React from 'react';

import { authClient } from '@/lib/auth-client';
import { client } from '@/orpc/client';
import { useArenaMutation } from '@/features/app/hooks/use-arena-mutation';
import { useDeviceId } from '@/features/app/hooks/use-device-id';
import { useSettings } from '@/features/app/contexts/settings';

const LS_KEY = 'tku-arena-last-selection';

type Persisted = {
  tournamentId: string | null;
  divisionId: string | null;
  matchId: string | null;
};

type LegacyPersisted = Persisted & {
  groupId?: string | null;
};

function readLocal(): Persisted | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as LegacyPersisted;
    return {
      tournamentId: parsed.tournamentId ?? null,
      divisionId: parsed.divisionId ?? parsed.groupId ?? null,
      matchId: parsed.matchId ?? null,
    };
  } catch {
    return null;
  }
}

function writeLocal(data: Persisted) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function toPersistId(value: string | null | undefined): string | null {
  if (value == null || value === '') {
    return null;
  }
  return value;
}

/** Server-first restore + persist selection for Advance Settings. */
export function useArenaLastSelection() {
  const deviceId = useDeviceId();
  const { data: session } = authClient.useSession();
  const { mutateAsync } = useArenaMutation();
  const { updateAdvanceForm, formData } = useSettings();
  const { advance } = formData;

  const lastRestoreKey = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!deviceId) {
      return;
    }

    const key = `${deviceId}:${session?.user?.id ?? 'anon'}`;
    if (lastRestoreKey.current === key) {
      return;
    }
    lastRestoreKey.current = key;

    void (async () => {
      if (session?.user) {
        try {
          const row = await client.device.lastSelection.get({ deviceId });
          if (row?.tournamentId || row?.divisionId || row?.matchId) {
            updateAdvanceForm({
              tournament: row.tournamentId,
              division: row.divisionId,
              match: row.matchId,
            });
            return;
          }
        } catch {
          // fall through to localStorage
        }
      }

      const local = readLocal();
      if (local) {
        updateAdvanceForm({
          tournament: local.tournamentId,
          division: local.divisionId,
          match: local.matchId,
        });
      }
    })();
  }, [deviceId, session?.user, updateAdvanceForm]);

  const persistRef = React.useRef({
    tournament: advance.tournament,
    division: advance.division,
    match: advance.match,
  });

  React.useEffect(() => {
    const prev = persistRef.current;
    const next = {
      tournament: advance.tournament,
      division: advance.division,
      match: advance.match,
    };

    const changed =
      prev.tournament !== next.tournament ||
      prev.division !== next.division ||
      prev.match !== next.match;

    persistRef.current = next;

    if (!changed || !deviceId) {
      return;
    }

    const tournamentId = toPersistId(next.tournament);
    const divisionId = toPersistId(next.division);
    const matchId = toPersistId(next.match);

    writeLocal({
      tournamentId,
      divisionId,
      matchId,
    });

    // Server row is only meaningful once tournament + division are chosen (match optional).
    if (session?.user && tournamentId && divisionId) {
      void mutateAsync({
        kind: 'device.lastSelection.set',
        payload: {
          deviceId,
          tournamentId,
          divisionId,
          matchId,
        },
      }).catch(() => {});
    }
  }, [
    advance.division,
    advance.match,
    advance.tournament,
    deviceId,
    mutateAsync,
    session?.user,
  ]);
}
