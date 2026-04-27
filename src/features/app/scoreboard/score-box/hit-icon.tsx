import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Transition } from 'motion/react';
import type { HitType, Player } from '@/lib/scoreboard/hit-types';
import { cn } from '@/lib/utils';
import {
  getHitIconPath,
  isCriticalHit,
  isSuperCriticalHit,
} from '@/lib/scoreboard/hit-types';

interface HitIconProps {
  player: Player;
  hitType: HitType | null;
  timestamp: number;
  className?: string;
}

const hitAnimations = {
  normal: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      scale: [1, 1.1, 1],
      x: [-5, 5, -5, 5, 0],
      opacity: 1,
    },
    exit: { scale: 1, opacity: 0 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  critical: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      scale: [1, 1.1, 1.2, 1.1, 1],
      opacity: 1,
      filter: [
        'brightness(1) drop-shadow(0 0 5px rgba(255, 0, 0, 0.5))',
        'brightness(1.5) drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))',
        'brightness(2) drop-shadow(0 0 25px rgba(255, 0, 0, 1))',
        'brightness(1.5) drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))',
        'brightness(1) drop-shadow(0 0 5px rgba(255, 0, 0, 0.5))',
      ],
    },
    exit: { scale: 1, opacity: 1 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  superCritical: {
    initial: { scale: 1, opacity: 1, rotate: 0 },
    animate: {
      scale: [1, 1.2, 1.4, 1.2, 1],
      rotate: [0, 5, -5, 5, 0],
      opacity: 1,
      filter: [
        'brightness(1) drop-shadow(0 0 5px rgba(255, 0, 0, 0.5))',
        'brightness(1.8) drop-shadow(0 0 20px rgba(255, 0, 0, 0.9))',
        'brightness(2.5) drop-shadow(0 0 30px rgba(255, 0, 0, 1))',
        'brightness(1.8) drop-shadow(0 0 20px rgba(255, 0, 0, 0.9))',
        'brightness(1) drop-shadow(0 0 5px rgba(255, 0, 0, 0.5))',
      ],
    },
    exit: { scale: 1, opacity: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

function getAnimationVariant(hitType: HitType | null) {
  if (!hitType) return hitAnimations.normal;
  if (isSuperCriticalHit(hitType)) return hitAnimations.superCritical;
  if (isCriticalHit(hitType)) return hitAnimations.critical;
  return hitAnimations.normal;
}

export const HitIcon = ({
  player,
  hitType,
  timestamp,
  className,
}: HitIconProps) => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (timestamp > 0) {
      setKey((prev) => prev + 1);
    }
  }, [timestamp]);

  if (!hitType) {
    return <HitIconPlaceholder className={className} />;
  }

  const iconPath = getHitIconPath(player, hitType);
  const animation = getAnimationVariant(hitType);

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center',
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={`${player}-${hitType}-${key}`}
          src={iconPath}
          alt={`${player} ${hitType} hit`}
          className="max-h-full max-w-full object-contain"
          initial={animation.initial}
          animate={animation.animate}
          exit={animation.exit}
          transition={animation.transition as Transition}
        />
      </AnimatePresence>
    </div>
  );
};

interface HitIconPlaceholderProps {
  className?: string;
}

export const HitIconPlaceholder = ({ className }: HitIconPlaceholderProps) => {
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center',
        className
      )}
    />
  );
};
