import { ColumnsIcon } from 'lucide-react';
import type * as React from 'react';

export interface FeatureFlag {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltipTitle: string;
  tooltipDescription: string;
}

export const featureFlagConfig = {
  dataTable: [
    {
      label: 'Column resizing',
      value: 'columnResizing' as const,
      icon: ColumnsIcon,
      tooltipTitle: 'Column resizing',
      tooltipDescription: 'Enable drag-to-resize columns in data tables.',
    },
  ],
} as const;

export type DataTableFeatureFlag =
  (typeof featureFlagConfig.dataTable)[number]['value'];
