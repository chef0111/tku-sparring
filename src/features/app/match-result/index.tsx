import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/stores/player-store';
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Ring } from '@/components/ui/ring';
import { Card } from '@/components/ui/card';

interface ResultDialogProps {
  winner: Player | null;
  redWon: number;
  blueWon: number;
  className?: string;
}

export const ResultDialog = ({
  winner,
  redWon,
  blueWon,
  className,
}: ResultDialogProps) => {
  const { redName, redAvatar, blueName, blueAvatar } = usePlayerStore(
    useShallow((s) => ({
      redName: s.red.name,
      redAvatar: s.red.avatar,
      blueName: s.blue.name,
      blueAvatar: s.blue.avatar,
    }))
  );

  const winnerName = winner === 'red' ? redName : blueName;
  const winnerAvatar =
    winner === 'red'
      ? redAvatar || 'assets/CapybaraTKU1.webp'
      : blueAvatar || 'assets/CapybaraTKU2.webp';

  return (
    <DialogContent
      className={cn(
        'flex h-dvh min-w-screen flex-col items-center justify-center gap-12 border-none! bg-transparent',
        className
      )}
      overlayClassName="h-dvh w-screen! bg-black/90!"
      closeButtonClassName="scale-200! top-6 right-6 no-focus"
    >
      <DialogHeader>
        <DialogTitle className="text-center text-8xl font-bold tracking-wide text-nowrap select-none">
          MATCH RESULT
        </DialogTitle>
      </DialogHeader>

      {/* Result */}
      <div className="flex h-44 w-full max-w-7xl items-stretch gap-4">
        <Card className="winner-label tex-foreground winner-label-indicator w-[64%] text-7xl">
          WINNER
        </Card>
        <Card className="winner-label winner-label-blue w-[18%] text-8xl">
          {blueWon}
        </Card>
        <Card className="winner-label winner-label-red w-[18%] text-8xl">
          {redWon}
        </Card>
      </div>

      {/* Winner info */}
      <div className="flex h-44 w-full max-w-7xl items-stretch gap-4">
        <Avatar
          className={cn(
            'h-full w-[26%] rounded-xl bg-white/10 after:border-none',
            winner === 'red' ? 'bg-red-600/20' : 'bg-blue-600/20'
          )}
        >
          <Ring className="rounded-xl ring-5" />
          <AvatarImage
            src={winnerAvatar}
            alt={winnerName}
            className="h-full w-full rounded-xl object-contain"
          />
          <AvatarFallback className="text-4xl font-bold">
            {winner === 'red' ? 'RED' : 'BLUE'}
          </AvatarFallback>
        </Avatar>

        <Card
          className={cn(
            'winner-label w-[74%] truncate text-7xl text-white uppercase',
            winner === 'red' ? 'winner-label-red' : 'winner-label-blue'
          )}
        >
          {winnerName}
        </Card>
      </div>

      {/* Actions */}
      <DialogFooter className="flex w-full max-w-7xl items-center justify-center! gap-6">
        <Button className="action-btn action-btn-cancel">CANCEL RESULT</Button>
        <Button className="action-btn action-btn-accept">ACCEPT RESULT</Button>
      </DialogFooter>
    </DialogContent>
  );
};
