import { DeviceLastSelectionDAL } from './dal';
import { GetLastSelectionSchema, SetLastSelectionSchema } from './dto';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';

export const getLastSelection = authorized
  .input(GetLastSelectionSchema)
  .handler(async ({ context, input }) => {
    return DeviceLastSelectionDAL.getForUserDevice(
      context.user.id,
      input.deviceId
    );
  });

export const setLastSelection = authorized
  .input(SetLastSelectionSchema)
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return DeviceLastSelectionDAL.upsertForUserDevice(context.user.id, input);
  });
