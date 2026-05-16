import z from 'zod';

export const UsernameSchema = z
  .string()
  .min(3, { message: 'Username must be at least 3 characters long.' })
  .max(30, { message: 'Username cannot exceed 30 characters.' })
  .regex(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'Username can only contain alphanumeric characters, underscores, dots, and hyphens.',
  })
  .regex(/[a-zA-Z]/, {
    message: 'Username must contain at least one letter.',
  });

export const PasswordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' })
  .max(100, { message: 'Password cannot exceed 100 characters.' })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter.',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter.',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
  .regex(/[^a-zA-Z0-9]/, {
    message: 'Password must contain at least one special character.',
  });

export const LoginSchema = z.object({
  username: UsernameSchema,
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .max(100, { message: 'Password must not exceed 100 characters.' })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).*$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    }),
});

export const StandardSettingsSchema = z.object({
  redPlayerAvatar: z.string().optional(),
  bluePlayerAvatar: z.string().optional(),
  redPlayerName: z.string().min(1, 'Player name is required'),
  bluePlayerName: z.string().min(1, 'Player name is required'),
  roundDuration: z.number().min(1, 'Round duration must be at least 1 second'),
  breakDuration: z.number().min(1, 'Break duration must be at least 1 second'),
  maxHealth: z.number().min(1, 'Max health must be at least 1'),
});

export const AdvanceSettingsSchema = StandardSettingsSchema.extend({
  tournament: z.string().min(1, 'Tournament is required'),
  group: z.string().min(1, 'Group is required'),
  match: z.string().min(1, 'Match is required'),
});

export const EditAthleteSchema = z.object({
  athleteCode: z.string().min(1, 'Athlete ID is required'),
  name: z.string().min(1, 'Athlete name is required'),
  gender: z.enum(['M', 'F'], {
    message: 'Gender must be either Male or Female',
  }),
  beltLevel: z.number().min(0, 'Belt level is required'),
  weight: z
    .number()
    .min(20, 'Weight must be at least 20kg')
    .max(100, 'Weight must be less than 100kg'),
  affiliation: z.string().min(1, 'Affiliation is required'),
  image: z.string().refine(
    (s) => {
      const t = s.trim();
      return t === '' || z.string().url().safeParse(t).success;
    },
    { message: 'Photo URL must be empty or a valid URL' }
  ),
});

export const GroupConstraintsSchema = z.object({
  gender: z
    .enum(['M', 'F'], { message: 'Gender must be Male or Female' })
    .nullable()
    .optional(),
  beltMin: z.number().int().min(0).max(10).nullable().optional(),
  beltMax: z.number().int().min(0).max(10).nullable().optional(),
  weightMin: z.number().min(20).max(150).nullable().optional(),
  weightMax: z.number().min(20).max(150).nullable().optional(),
});

export const GroupSettingsSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  gender: z.enum(['M', 'F']).nullable().optional(),
  beltMin: z.number().int().min(0).max(10).nullable().optional(),
  beltMax: z.number().int().min(0).max(10).nullable().optional(),
  weightMin: z.number().min(20).max(150).nullable().optional(),
  weightMax: z.number().min(20).max(150).nullable().optional(),
  thirdPlaceMatch: z.boolean(),
  arenaIndex: z.number().int().min(1),
});

export const MatchScoreSchema = z.object({
  redWins: z.number().int().min(0).max(2),
  blueWins: z.number().int().min(0).max(2),
});

export const CustomMatchAthleteSchema = z.enum(['direct', 'winner', 'loser']);

export type CustomMatchAthlete = z.infer<typeof CustomMatchAthleteSchema>;

export function customMatchCornersUseSameSource(data: {
  redAthlete: CustomMatchAthlete;
  blueAthlete: CustomMatchAthlete;
  redSelectionId: string;
  blueSelectionId: string;
}): boolean {
  const r = data.redSelectionId.trim();
  const b = data.blueSelectionId.trim();
  if (!r || r !== b) return false;
  if (data.redAthlete === 'direct' && data.blueAthlete === 'direct')
    return true;
  if (data.redAthlete === 'direct' || data.blueAthlete === 'direct')
    return false;
  return data.redAthlete === data.blueAthlete;
}

export const CreateCustomMatchFormSchema = z
  .object({
    displayLabel: z
      .string()
      .trim()
      .min(1, { message: 'Match label is required.' })
      .max(120, { message: 'Match label cannot exceed 120 characters.' }),
    redAthlete: CustomMatchAthleteSchema,
    redSelectionId: z.string(),
    blueAthlete: CustomMatchAthleteSchema,
    blueSelectionId: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.redSelectionId.trim()) {
      ctx.addIssue({
        code: 'custom',
        message:
          data.redAthlete === 'direct'
            ? 'Select a red athlete.'
            : 'Select a feeder match for red.',
        path: ['redSelectionId'],
      });
    }
    if (!data.blueSelectionId.trim()) {
      ctx.addIssue({
        code: 'custom',
        message:
          data.blueAthlete === 'direct'
            ? 'Select a blue athlete.'
            : 'Select a feeder match for blue.',
        path: ['blueSelectionId'],
      });
    }
    if (customMatchCornersUseSameSource(data)) {
      ctx.addIssue({
        code: 'custom',
        message:
          data.redAthlete === 'direct' && data.blueAthlete === 'direct'
            ? 'Red and blue must be different athletes.'
            : 'Red and blue cannot use the same match source.',
        path: ['blueSelectionId'],
      });
    }
  });

export type CreateCustomMatchFormValues = z.infer<
  typeof CreateCustomMatchFormSchema
>;
