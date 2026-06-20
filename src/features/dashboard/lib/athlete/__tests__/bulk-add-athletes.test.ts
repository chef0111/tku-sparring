import { describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { bulkAddAthleteResult } from '../bulk-add-athletes';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn() },
}));

describe('bulkAddAthleteResult', () => {
  it('shows info when added is 0', () => {
    bulkAddAthleteResult({ added: 0, assigned: 0, unassigned: 0 });
    expect(toast.info).toHaveBeenCalledWith(
      'Selected athletes are already in this tournament.'
    );
  });

  it('shows pool-only message when all unassigned', () => {
    bulkAddAthleteResult({ added: 3, assigned: 0, unassigned: 3 });
    expect(toast.success).toHaveBeenCalledWith(
      'Added 3 athletes to the unassigned pool.'
    );
  });

  it('shows split message when some assigned', () => {
    bulkAddAthleteResult({ added: 3, assigned: 2, unassigned: 1 });
    expect(toast.success).toHaveBeenCalledWith(
      'Added 3 athletes. 2 assigned, 1 unassigned.'
    );
  });
});
