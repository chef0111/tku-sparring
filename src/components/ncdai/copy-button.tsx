'use client';

import { motion } from 'motion/react';
import { CheckIcon, CircleXIcon, CopyIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import type { CopyInput, CopyState } from '@/hooks/use-copy-to-clipboard';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { IconSwap, IconSwapItem } from '@/components/ncdai/icon-swap';

export type CopyStateIconProps = {
  state: CopyState;
  /** Custom icon for idle state. */
  idleIcon?: React.ReactNode;
  /** Custom icon for done state. */
  doneIcon?: React.ReactNode;
  /** Custom icon for error state. */
  errorIcon?: React.ReactNode;
};

export function CopyStateIcon({
  state,
  idleIcon,
  doneIcon,
  errorIcon,
}: CopyStateIconProps) {
  return (
    <IconSwap>
      <IconSwapItem key={state} as={motion.span}>
        {state === 'idle' && (idleIcon ?? <CopyIcon data-slot="idle-icon" />)}

        {state === 'done' && (doneIcon ?? <CheckIcon data-slot="done-icon" />)}

        {state === 'error' &&
          (errorIcon ?? <CircleXIcon data-slot="error-icon" />)}
      </IconSwapItem>
    </IconSwap>
  );
}

export type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  'onCopySuccess' | 'onCopyError'
> & {
  /** Text to copy. Provide `text` or `blob`, not both. */
  text?: string | (() => string);
  /** Blob to copy (e.g. PNG screenshot). Provide `text` or `blob`, not both. */
  blob?: Blob | (() => Blob);
  /** MIME type when copying a blob. Defaults to `image/png`. */
  mimeType?: string;
  /** Called with the copied text on successful text copy. */
  onCopySuccess?: (text: string) => void;
  /** Called with the error if the copy operation fails. */
  onCopyError?: (error: Error) => void;
} & Omit<CopyStateIconProps, 'state'>;

function toCopyInput({
  text,
  blob,
  mimeType = 'image/png',
}: Pick<CopyButtonProps, 'text' | 'blob' | 'mimeType'>): CopyInput {
  if (blob != null) {
    return { blob, mimeType };
  }
  if (text != null) {
    return text;
  }
  throw new Error('CopyButton requires `text` or `blob`');
}

export function CopyButton({
  size = 'icon',
  children,
  text,
  blob,
  mimeType,
  idleIcon,
  doneIcon,
  errorIcon,
  onClick,
  onCopySuccess,
  onCopyError,
  ...props
}: CopyButtonProps) {
  const { state, copy } = useCopyToClipboard({
    onCopySuccess,
    onCopyError,
  });

  return (
    <Button
      size={size}
      onClick={(e) => {
        void copy(toCopyInput({ text, blob, mimeType }));
        onClick?.(e);
      }}
      aria-label="Copy"
      {...props}
    >
      <CopyStateIcon
        state={state}
        idleIcon={idleIcon}
        doneIcon={doneIcon}
        errorIcon={errorIcon}
      />
      {children}
    </Button>
  );
}
