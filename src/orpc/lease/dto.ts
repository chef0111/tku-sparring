import { z } from 'zod';

export const LeaseStatusSchema = z.enum([
  'available',
  'held_by_me',
  'held_by_other',
  'pending_takeover',
]);

export const LeaseTakeoverRequestStatusSchema = z.enum([
  'pending',
  'approved',
  'denied',
  'expired',
]);

export const AcquireLeaseSchema = z.object({
  groupId: z.string(),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const HeartbeatLeaseSchema = AcquireLeaseSchema;

export const ReleaseLeaseSchema = AcquireLeaseSchema;

export const RequestTakeoverSchema = AcquireLeaseSchema;

export const RespondTakeoverSchema = z.object({
  requestId: z.string(),
  approve: z.boolean(),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const ListLeasesForTournamentSchema = z.object({
  tournamentId: z.string().min(1, 'tournamentId is required'),
  deviceId: z.string().optional(),
});

export type AcquireLeaseDTO = z.infer<typeof AcquireLeaseSchema>;
export type HeartbeatLeaseDTO = z.infer<typeof HeartbeatLeaseSchema>;
export type ReleaseLeaseDTO = z.infer<typeof ReleaseLeaseSchema>;
export type RequestTakeoverDTO = z.infer<typeof RequestTakeoverSchema>;
export type RespondTakeoverDTO = z.infer<typeof RespondTakeoverSchema>;
export type ListLeasesForTournamentDTO = z.infer<
  typeof ListLeasesForTournamentSchema
>;
