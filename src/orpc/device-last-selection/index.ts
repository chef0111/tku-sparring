import { DeviceLastSelectionDAL } from './dal';
import { GetLastSelectionSchema, SetLastSelectionSchema } from './dto';
import { authedProcedure } from '@/orpc/middleware';

export const getLastSelection = authedProcedure
  .input(GetLastSelectionSchema)
  .handler(async ({ context, input }) => {
    return DeviceLastSelectionDAL.getForUserDevice(
      context.user.id,
      input.deviceId
    );
  });

export const setLastSelection = authedProcedure
  .input(SetLastSelectionSchema)
  .handler(async ({ context, input }) => {
    return DeviceLastSelectionDAL.upsertForUserDevice(context.user.id, input);
  });
