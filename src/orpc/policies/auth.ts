import type { User } from '@/lib/auth';
import { forbidden } from '@/orpc/errors';

export function assertSystemAdmin(user: User) {
  // Current product model is System Admin only. Until a role field exists,
  // every authenticated user is treated as admin in one explicit place.
  if (!user?.id) {
    forbidden();
  }
}
