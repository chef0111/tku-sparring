import { useCallback, useRef, useState } from 'react';

export type CopyState = 'idle' | 'done' | 'error';

export type BlobCopyInput = {
  blob: Blob | (() => Blob);
  mimeType: string;
};

export type CopyInput = string | (() => string) | BlobCopyInput;

export type UseCopyToClipboardOptions = {
  onCopySuccess?: (text: string) => void;
  onCopyError?: (error: Error) => void;
  resetDelay?: number;
};

function isBlobCopy(input: CopyInput): input is BlobCopyInput {
  return typeof input === 'object' && input !== null && 'blob' in input;
}

export function useCopyToClipboard({
  onCopySuccess,
  onCopyError,
  resetDelay = 1500,
}: UseCopyToClipboardOptions = {}) {
  const [state, setState] = useState<CopyState>('idle');
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (input: CopyInput) => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }

      try {
        if (isBlobCopy(input)) {
          const blob =
            typeof input.blob === 'function' ? input.blob() : input.blob;
          await navigator.clipboard.write([
            new ClipboardItem({ [input.mimeType]: blob }),
          ]);
          onCopySuccess?.('');
        } else {
          const finalText = typeof input === 'function' ? input() : input;
          await navigator.clipboard.writeText(finalText);
          onCopySuccess?.(finalText);
        }

        setState('done');
      } catch (error) {
        setState('error');

        onCopyError?.(
          error instanceof Error ? error : new Error('Copy failed')
        );
      } finally {
        resetTimeoutRef.current = setTimeout(() => {
          setState('idle');
        }, resetDelay);
      }
    },
    [onCopySuccess, onCopyError, resetDelay]
  );

  return { state, copy } as const;
}
