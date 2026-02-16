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

const AthleteSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  beltLevel: z.string().min(1, 'Belt level is required'),
  weight: z.string().min(1, 'Weight is required'),
  affiliation: z.string().min(1, 'Affiliation is required'),
});

export const AddAthletesSchema = z.object({
  athletes: z.array(AthleteSchema).min(1, 'At least one athlete is required'),
});
