import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import type { CreateAthleteProfileDTO } from '@/orpc/athlete-profiles/athlete-profiles.dto';
import { parseImportFile } from '@/lib/data-table/import';
import { client } from '@/orpc/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

interface AthleteRowValues {
  athleteCode: string;
  name: string;
  gender: string;
  beltLevel: number | string;
  weight: number | string;
  affiliation: string;
}

interface AthleteImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AthleteImportDialog({
  open,
  onOpenChange,
}: AthleteImportDialogProps) {
  const [preview, setPreview] = React.useState<Array<AthleteRowValues> | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: CreateAthleteProfileDTO) =>
      client.athleteProfile.create(data),
  });

  function resetState() {
    setPreview(null);
    setError(null);
    setIsImporting(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreview(null);
    const result = await parseImportFile<AthleteRowValues>(file);
    if (!result.success || !result.data) {
      setError(result.error ?? 'Failed to parse file.');
    } else {
      setPreview(result.data);
    }
  }

  async function handleImport() {
    if (!preview) return;
    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;
    for (const row of preview) {
      try {
        await createMutation.mutateAsync({
          athleteCode: row.athleteCode.trim(),
          name: row.name,
          gender: row.gender?.trim().toUpperCase() === 'F' ? 'F' : 'M',
          beltLevel: Number(row.beltLevel),
          weight: Number(row.weight),
          affiliation: row.affiliation,
          confirmDuplicate: true,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    if (failCount > 0) {
      toast.warning(
        `Imported ${successCount} athletes, ${failCount} failed (duplicates or invalid data)`
      );
    } else {
      toast.success(`Imported ${successCount} athletes`);
    }
    queryClient.invalidateQueries({ queryKey: ['athleteProfile'] });
    onOpenChange(false);
    resetState();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Athletes</DialogTitle>
          <DialogDescription>
            Upload a .csv or .xlsx file to import athletes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileChange}
            disabled={isImporting}
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {preview && (
            <p className="text-muted-foreground text-sm">
              Found {preview.length} athlete{preview.length !== 1 ? 's' : ''} to
              import.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={!preview || preview.length === 0 || isImporting}
            onClick={handleImport}
          >
            {isImporting ? (
              <>
                <Spinner className="text-primary-foreground" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <UserPlus />
                <span>Import {preview?.length ?? 0} Athletes</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
