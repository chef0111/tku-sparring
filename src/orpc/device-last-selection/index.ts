import { GetLastSelectionSchema, SetLastSelectionSchema } from './dto';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';
import { getLastSelection as runGetLastSelection } from '@/server/application/device-last-selection/use-cases/get';
import { setLastSelection as runSetLastSelection } from '@/server/application/device-last-selection/use-cases/set';

export const getLastSelection = authorized
  .input(GetLastSelectionSchema)
  .handler(async ({ context, input }) =>
    runGetLastSelection(
      { userId: context.user.id, deviceId: input.deviceId },
      context.repos.deviceLastSelection
    )
  );

export const setLastSelection = authorized
  .input(SetLastSelectionSchema)
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return runSetLastSelection(
      { userId: context.user.id, ...input },
      context.repos.deviceLastSelection
    );
  });
