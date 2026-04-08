import { createFileRoute } from '@tanstack/react-router';
import { Activity } from 'react';

import { IconDeviceLaptop } from '@tabler/icons-react';
import { AppHome } from '@/modules/app';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useMediaQuery } from '@/hooks/use-media-query';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="h-dvh w-dvw">
      <AppHome />

      <Activity mode={!isDesktop ? 'visible' : 'hidden'}>
        <div className="flex h-full w-full items-center justify-center p-8">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-36">
                <IconDeviceLaptop className="size-30" />
              </EmptyMedia>
              <EmptyTitle className="text-4xl font-bold">
                Desktop Only
              </EmptyTitle>
            </EmptyHeader>
            <EmptyDescription className="text-xl">
              This application is optimized for desktop screens (width {'>'}=
              1280px). Please switch to a larger device.
            </EmptyDescription>
          </Empty>
        </div>
      </Activity>
    </div>
  );
}
