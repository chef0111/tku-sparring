import { useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import { cn } from '@/lib/utils';
import { computeHealthKeyframes } from '@/lib/hud/health-utils';

interface HealthbarProps {
  health: number;
  maxHealth?: number;
  className?: string;
  side: 'red' | 'blue';
}

export const Healthbar = ({
  health,
  maxHealth = 120,
  className,
  side,
}: HealthbarProps) => {
  const healthPct = (health / maxHealth) * 100;

  // Track previous health for keyframe generation
  const prevHealthPct = useRef(healthPct);
  const [delayedHealthPct, setDelayedHealthPct] = useState(() => healthPct);
  const [isInitialized, setIsInitialized] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(0);

  // Animation scope for the health meter
  const [scope, animate] = useAnimate();

  useEffect(() => {
    // Skip the initial render to avoid flash
    if (!isInitialized) {
      setIsInitialized(true);
      setDelayedHealthPct(healthPct);
      prevHealthPct.current = healthPct;
      return;
    }

    const keyframes = computeHealthKeyframes(prevHealthPct.current, healthPct);
    const duration = keyframes.widths.length * 0.3;
    setAnimationDuration(duration);

    if (scope.current) {
      animate(
        scope.current,
        {
          width: keyframes.widths,
          backgroundImage: keyframes.gradients,
        },
        {
          duration,
          ease: 'easeOut',
        }
      );
    }

    const timeout = setTimeout(() => {
      setDelayedHealthPct(healthPct);
    }, 100);

    prevHealthPct.current = healthPct;

    return () => clearTimeout(timeout);
  }, [healthPct, isInitialized, animate, scope]);

  return (
    <HealthbarFrame className={className}>
      <HealthbarMeter
        ref={scope}
        healthPct={healthPct}
        delayedHealthPct={delayedHealthPct}
        animationDuration={animationDuration}
        side={side}
      />
    </HealthbarFrame>
  );
};

interface HealthbarFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const HealthbarFrame = ({
  children,
  className,
}: HealthbarFrameProps) => {
  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="healthbar-head" />
      <div className="relative h-[85%] w-full rounded-[3px] border-[0.2rem] border-white bg-transparent ring-2 ring-black">
        {children}
      </div>
      <div className="healthbar-head" />
    </div>
  );
};

interface HealthbarMeterProps {
  className?: string;
  healthPct: number;
  delayedHealthPct: number;
  animationDuration: number;
  side: 'red' | 'blue';
}

export const HealthbarMeter = ({
  className,
  healthPct,
  delayedHealthPct,
  animationDuration,
  side,
  ref,
}: HealthbarMeterProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const initialKeyframes = computeHealthKeyframes(healthPct, healthPct);

  return (
    <div
      className={cn(
        'relative flex h-full w-full',
        side === 'blue' ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <motion.div
        ref={ref}
        className="health-meter"
        initial={{
          width: `${healthPct}%`,
          backgroundImage: initialKeyframes.gradients[0],
        }}
      />
      <div
        className="health-meter-delay"
        style={{
          width: `${delayedHealthPct}%`,
          transition: `width ${animationDuration}s ease-out 0.5s`,
          ...(side === 'blue' ? { right: 0 } : { left: 0 }),
        }}
      />
    </div>
  );
};
