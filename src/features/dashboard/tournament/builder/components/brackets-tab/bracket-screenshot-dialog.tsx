import * as React from 'react';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useTournamentBracket } from '../../context/tournament-bracket/use-tournament-bracket';
import { useBracketChrome } from '../../context/bracket-chrome';
import {
  bracketScreenshotFilename,
  captureBracketPng,
} from '../../lib/capture-bracket-png';
import { useTournament } from '@/queries/tournament';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

export function BracketScreenshotDialog() {
  const { screenshotOpen, setScreenshotOpen, captureTarget } =
    useBracketChrome();
  const { tournamentId, selectedGroup } = useTournamentBracket();
  const tournamentQuery = useTournament(tournamentId);

  const [blob, setBlob] = React.useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!screenshotOpen || !captureTarget) {
      setBlob(null);
      return;
    }

    let cancelled = false;
    setIsCapturing(true);
    setBlob(null);

    void captureBracketPng({
      root: captureTarget.root,
      width: captureTarget.width,
      height: captureTarget.height,
    })
      .then((result) => {
        if (!cancelled) setBlob(result);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to capture bracket'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsCapturing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [screenshotOpen, captureTarget]);

  React.useEffect(() => {
    if (!blob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const filename = bracketScreenshotFilename(
    tournamentQuery.data?.name ?? 'tournament',
    selectedGroup?.name ?? 'group'
  );

  const actionsDisabled = isCapturing || !blob;

  const handleCopy = async () => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleSave = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={screenshotOpen} onOpenChange={setScreenshotOpen}>
      <DialogContent className="gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bracket screenshot</DialogTitle>
          <DialogDescription>
            Screenshot export for {selectedGroup?.name ?? 'this group'}. Copy or
            save without closing this preview.
          </DialogDescription>
        </DialogHeader>

        <div className="border-border max-h-[70vh] overflow-auto rounded-lg border bg-white">
          {isCapturing ? (
            <div className="flex min-h-48 items-center justify-center gap-2 p-8">
              <Spinner className="size-5" />
              <span className="text-muted-foreground text-sm">
                Capturing bracket…
              </span>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Bracket preview"
              className="mx-auto block max-w-full"
            />
          ) : (
            <div className="text-muted-foreground flex min-h-48 items-center justify-center p-8 text-sm">
              No bracket to preview
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={actionsDisabled}
            onClick={() => void handleCopy()}
          >
            <Copy />
            Copy
          </Button>
          <Button type="button" disabled={actionsDisabled} onClick={handleSave}>
            <Download />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
