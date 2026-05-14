import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Healthbar } from './healthbar';
import { Manabar } from './manabar';
import { PlayerAvatar } from './player-avatar';
import { usePlayerStore } from '@/stores/player-store';
import { useDeclareWinner } from '@/hooks/use-winner';
import { isCriticalHit } from '@/lib/scoreboard/hit-types';
import { cn } from '@/lib/utils';

export const AppHUD = ({ className }: { className?: string }) => {
  return (
    <section
      className={cn(
        'flex h-[14vh] w-full max-w-screen items-center justify-between',
        className
      )}
    >
      <PlayerHUD player="red" />
      <PlayerHUD player="blue" />
    </section>
  );
};

interface PlayerHUDProps {
  player: Player;
}

const PlayerHUD = ({ player }: PlayerHUDProps) => {
  const { health, mana, name, avatar, maxHealth, opponentLastHit } =
    usePlayerStore(
      useShallow((s) => ({
        health: s[player].health,
        mana: s[player].mana,
        name: s[player].name,
        avatar: s[player].avatar,
        maxHealth: s.maxHealth,
        opponentLastHit: player === 'red' ? s.lastBlueHit : s.lastRedHit,
      }))
    );
  const prevHitTimestamp = useRef<number | null>(null);
  const [showCriticalAnimation, setShowCriticalAnimation] = useState(false);

  useEffect(() => {
    if (
      opponentLastHit &&
      opponentLastHit.timestamp !== prevHitTimestamp.current &&
      isCriticalHit(opponentLastHit.hitType)
    ) {
      setShowCriticalAnimation(true);
      const timer = setTimeout(() => setShowCriticalAnimation(false), 500);
      prevHitTimestamp.current = opponentLastHit.timestamp;
      return () => clearTimeout(timer);
    }
    if (opponentLastHit) {
      prevHitTimestamp.current = opponentLastHit.timestamp;
    }
  }, [opponentLastHit]);

  const { forceWinner } = useDeclareWinner();
  const handleForceWin = useCallback(
    () => forceWinner(player),
    [forceWinner, player]
  );

  const defaultAvatar =
    player === 'red' ? 'assets/CapybaraTKU1.webp' : 'assets/CapybaraTKU2.webp';
  const avatarSrc = avatar ?? defaultAvatar;

  const playerHud =
    player === 'red' ? (
      <div className="flex h-full w-[50%] items-center justify-start">
        <PlayerAvatar
          name={name}
          image={avatarSrc}
          className="bg-red-player relative h-[14vh] w-[13vw] rounded-xl!"
          fallback={
            <img
              src={avatarSrc}
              alt={name}
              className="relative size-full rounded-sm object-contain"
            />
          }
          onDoubleClick={handleForceWin}
          isCriticalHit={showCriticalAnimation}
        />
        <div className="flex h-full w-full flex-col items-start">
          <Healthbar
            health={health}
            maxHealth={maxHealth}
            className="healthbar-primitive"
            side="red"
          />
          <Manabar mana={mana} className="manabar-primitive" side="red" />
        </div>
      </div>
    ) : (
      <div className="flex h-full w-[50%] items-center justify-end">
        <div className="flex h-full w-full flex-col items-end">
          <Healthbar
            health={health}
            maxHealth={maxHealth}
            className="healthbar-primitive"
            side="blue"
          />
          <Manabar mana={mana} className="manabar-primitive" side="blue" />
        </div>
        <PlayerAvatar
          name={name}
          image={avatarSrc}
          className="bg-blue-player relative h-[14vh] w-[13vw] rounded-xl!"
          fallback={
            <img
              src={avatarSrc}
              alt={name}
              className="relative size-full rounded-sm object-contain"
            />
          }
          onDoubleClick={handleForceWin}
          isCriticalHit={showCriticalAnimation}
        />
      </div>
    );

  return playerHud;
};
