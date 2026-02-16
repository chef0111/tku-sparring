import { createFileRoute } from '@tanstack/react-router';
import { AthletePage } from '@/modules/dashboard/athlete';

// Route validation is intentionally omitted - nuqs handles all search params
// (page, perPage, sort, filters, filterFlag, joinOperator)
export const Route = createFileRoute('/dashboard/athlete')({
  component: AthletePage,
});
