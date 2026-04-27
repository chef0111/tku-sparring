import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ManabarProps {
  mana: number;
  className?: string;
  meterClassName?: string;
  side: 'red' | 'blue';
}

export const Manabar = ({
  mana,
  className,
  meterClassName,
  side,
}: ManabarProps) => {
  return (
    <ManabarFrame className={className}>
      <ManabarMeter mana={mana} className={meterClassName} side={side} />
    </ManabarFrame>
  );
};

interface ManabarFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const ManabarFrame = ({ children, className }: ManabarFrameProps) => {
  return (
    <div
      className={cn(
        'relative flex h-[30%] items-center justify-between',
        className
      )}
    >
      <div className="manabar-head" />
      <div className="relative h-[85%] w-full rounded-xs border border-white bg-transparent ring-2 ring-black">
        {children}
      </div>
      <div className="manabar-head" />
    </div>
  );
};

interface ManabarMeterProps {
  mana: number;
  className?: string;
  side: 'red' | 'blue';
}

export const ManabarMeter = ({ mana, className, side }: ManabarMeterProps) => {
  const maxMana = 5;
  const prevMana = useRef(mana);
  const [flash, setFlash] = useState<{
    index: number;
    type: 'gain' | 'loss';
  } | null>(null);

  useEffect(() => {
    if (prevMana.current !== mana) {
      const affectedMana = Math.max(mana, prevMana.current) - 1;
      const type = mana > prevMana.current ? 'gain' : 'loss';
      setFlash({ index: affectedMana, type });
      const timer = setTimeout(() => setFlash(null), 800);
      prevMana.current = mana;
      return () => clearTimeout(timer);
    }
  }, [mana]);

  const manaBlocks = (
    <div className="flex h-full w-full">
      {Array.from({ length: maxMana }).map((_, index) => (
        <ManaBlock
          key={index}
          manaLevel={maxMana - index}
          flashType={flash?.index === index ? flash.type : null}
          isVisible={index < mana}
        />
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        'relative flex h-full w-full',
        side === 'blue' ? 'rotate-180' : '',
        className
      )}
    >
      {manaBlocks}
    </div>
  );
};

interface ManaBlockProps {
  manaLevel: number;
  className?: string;
  flashType?: 'gain' | 'loss' | null;
  isVisible?: boolean;
}

export const ManaBlock = ({
  manaLevel,
  className,
  flashType,
  isVisible = true,
}: ManaBlockProps) => {
  const manaColorMap: Record<number, string> = {
    1: '#fcf652',
    2: '#fae624',
    3: '#fbcf08',
    4: '#f6b00a',
    5: '#fc9406',
  };

  return (
    <div
      className={cn(
        'relative h-full w-[20%] border-2 border-white transition-all duration-1000',
        flashType === 'loss' && 'animate-mana-flash',
        flashType === 'gain' && 'animate-mana-gain',
        !isVisible && 'opacity-0',
        className
      )}
      style={{
        backgroundColor: isVisible ? manaColorMap[manaLevel] : 'transparent',
      }}
    />
  );
};
