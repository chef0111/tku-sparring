import * as React from 'react';
import { Copy, Download, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useTournamentBracket } from '../../context/tournament-bracket/use-tournament-bracket';
import { useBracketChrome } from '../../context/bracket-chrome';
import {
  bracketScreenshotFilename,
  captureBracketBothThemes,
} from '../../lib/capture-bracket-png';
import type { BracketScreenshotTheme } from '../../lib/capture-bracket-png';
import { useTournament } from '@/queries/tournament';
import { useResolvedTheme } from '@/contexts/themes/use-theme';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function BracketScreenshotDialog() {
  const { screenshotOpen, setScreenshotOpen, captureTarget } =
    useBracketChrome();
  const { tournamentId, selectedGroup } = useTournamentBracket();
  const tournamentQuery = useTournament(tournamentId);
  const resolvedTheme = useResolvedTheme();

  const [previewTheme, setPreviewTheme] =
    React.useState<BracketScreenshotTheme>(resolvedTheme);
  const [blobs, setBlobs] = React.useState<Record<
    BracketScreenshotTheme,
    Blob
  > | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (screenshotOpen) {
      setPreviewTheme(resolvedTheme);
    }
  }, [screenshotOpen, resolvedTheme]);

  React.useEffect(() => {
    if (!screenshotOpen || !captureTarget) {
      setBlobs(null);
      return;
    }

    let cancelled = false;
    setIsCapturing(true);
    setBlobs(null);

    void captureBracketBothThemes(
      captureTarget.root,
      captureTarget.width,
      captureTarget.height
    )
      .then((result) => {
        if (!cancelled) setBlobs(result);
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
    if (!blobs) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(blobs[previewTheme]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blobs, previewTheme]);

  const filename = bracketScreenshotFilename(
    tournamentQuery.data?.name ?? 'tournament',
    selectedGroup?.name ?? 'group'
  );

  const activeBlob = blobs?.[previewTheme] ?? null;
  const actionsDisabled = isCapturing || !activeBlob;

  const handleCopy = async () => {
    if (!activeBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': activeBlob }),
      ]);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleSave = () => {
    if (!activeBlob) return;
    const url = URL.createObjectURL(activeBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Screenshot saved');
  };

  return (
    <Dialog open={screenshotOpen} onOpenChange={setScreenshotOpen}>
      <DialogContent className="gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bracket screenshot</DialogTitle>
          <DialogDescription>
            Full bracket export for {selectedGroup?.name ?? 'this group'}. Copy
            or save without closing this preview.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div className="border-border bg-muted/30 max-h-[70vh] overflow-auto rounded-lg border">
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

          <ToggleGroup
            type="single"
            value={previewTheme}
            onValueChange={(value) => {
              if (value === 'light' || value === 'dark') setPreviewTheme(value);
            }}
            variant="outline"
            size="sm"
            className="bg-background absolute top-2 right-2 shadow-sm"
            aria-label="Screenshot theme"
          >
            <ToggleGroupItem value="light" aria-label="Light theme">
              <Sun className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark theme">
              <Moon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
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
