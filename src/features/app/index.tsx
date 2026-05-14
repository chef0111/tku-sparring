import { Activity } from 'react';
import { AppArenaSideEffects } from './components/app-arena-side-effects';
import { AppHUD } from './components/hud';
import { ResultDialog } from './components/match-result';
import { Scoreboard } from './components/scoreboard';
import { useMatchResult } from '@/hooks/use-match-result';
import { useFinishMatch } from '@/features/app/hooks/use-finish-match';
import { Navbar } from '@/components/navigation/navbar';
import { Dialog } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/use-media-query';

export const AppHome = () => {
  const { isMatchOver, matchWinner, redWon, blueWon, onClose } =
    useMatchResult();
  const { accept, cancel } = useFinishMatch();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <>
      <AppArenaSideEffects />
      <Navbar />
      <Activity mode={isDesktop ? 'visible' : 'hidden'}>
        <AppHUD />
        <Scoreboard />
        <Dialog open={isMatchOver} onOpenChange={(open) => !open && onClose()}>
          <ResultDialog
            winner={matchWinner}
            redWon={redWon}
            blueWon={blueWon}
            onAccept={accept}
            onCancel={cancel}
          />
        </Dialog>
      </Activity>
    </>
  );
};
