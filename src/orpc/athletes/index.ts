import { z } from 'zod';
import {
  CreateAthleteSchema,
  CreateAthletesSchema,
  DeleteAthletesSchema,
  ReorderAthletesSchema,
  UpdateAthleteSchema,
} from './athletes.dto';
import {
  create,
  createMany,
  deleteAthlete,
  deleteAthletes,
  findAll,
  reorder,
  update,
} from './athletes.dal';
import type { Prisma } from '@prisma/client';
import { authedProcedure } from '@/orpc/middleware';

const searchParamsSchema = z.object({
  page: z.number().optional().default(1),
  perPage: z.number().optional().default(10),
  sort: z
    .array(z.object({ id: z.string(), desc: z.boolean() }))
    .optional()
    .default([]),
  filters: z
    .array(
      z.object({
        id: z.string(),
        value: z.union([z.string(), z.array(z.string())]),
        variant: z.string().optional(),
        operator: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  groupId: z.string().optional(),
  tournamentId: z.string().optional(),
});

function buildWhereClause(
  filters: z.infer<typeof searchParamsSchema>['filters'],
  groupId?: string,
  tournamentId?: string
): Prisma.AthleteWhereInput {
  const where: Prisma.AthleteWhereInput = {};

  if (groupId) where.groupId = groupId;
  if (tournamentId) where.tournamentId = tournamentId;

  const conditions: Array<Prisma.AthleteWhereInput> = [];

  for (const filter of filters) {
    const { id, value, operator } = filter;
    const field = id as keyof Prisma.AthleteWhereInput;

    if (
      value === '' ||
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)
    ) {
      continue;
    }

    if (field === 'weight') {
      const num = typeof value === 'string' ? parseFloat(value) : NaN;
      if (!isNaN(num)) {
        switch (operator) {
          case 'eq':
            conditions.push({ [field]: num });
            break;
          case 'ne':
            conditions.push({ [field]: { not: num } });
            break;
          case 'lt':
            conditions.push({ [field]: { lt: num } });
            break;
          case 'lte':
            conditions.push({ [field]: { lte: num } });
            break;
          case 'gt':
            conditions.push({ [field]: { gt: num } });
            break;
          case 'gte':
            conditions.push({ [field]: { gte: num } });
            break;
          default:
            conditions.push({ [field]: num });
        }
      }
    } else if (typeof value === 'string') {
      switch (operator) {
        case 'eq':
          conditions.push({ [field]: value });
          break;
        case 'ne':
          conditions.push({ [field]: { not: value } });
          break;
        case 'iLike':
          conditions.push({
            [field]: { contains: value, mode: 'insensitive' },
          });
          break;
        case 'notILike':
          conditions.push({
            NOT: { [field]: { contains: value, mode: 'insensitive' } },
          });
          break;
        default:
          conditions.push({
            [field]: { contains: value, mode: 'insensitive' },
          });
      }
    } else if (Array.isArray(value) && value.length > 0) {
      switch (operator) {
        case 'inArray':
          conditions.push({ [field]: { in: value } });
          break;
        case 'notInArray':
          conditions.push({ [field]: { notIn: value } });
          break;
        default:
          conditions.push({ [field]: { in: value } });
      }
    }
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  return where;
}

function buildOrderBy(
  sort: z.infer<typeof searchParamsSchema>['sort']
): Array<Prisma.AthleteOrderByWithRelationInput> {
  return sort.map((s) => ({
    [s.id]: s.desc ? 'desc' : 'asc',
  }));
}

export const listAthletes = authedProcedure
  .input(searchParamsSchema)
  .handler(async ({ input }) => {
    const { page, perPage, sort, filters, groupId, tournamentId } = input;

    const where = buildWhereClause(filters, groupId, tournamentId);
    const orderBy = buildOrderBy(sort);

    const { data, total } = await findAll({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      data,
      pageCount: Math.ceil(total / perPage),
    };
  });

export const createAthlete = authedProcedure
  .input(CreateAthleteSchema)
  .handler(async ({ input }) => {
    return create(input);
  });

export const createAthletes = authedProcedure
  .input(CreateAthletesSchema)
  .handler(async ({ input }) => {
    return createMany(input.athletes);
  });

export const updateAthlete = authedProcedure
  .input(UpdateAthleteSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return update(id, data);
  });

export const removeAthlete = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return deleteAthlete(input.id);
  });

export const removeAthletes = authedProcedure
  .input(DeleteAthletesSchema)
  .handler(async ({ input }) => {
    return deleteAthletes(input.ids);
  });

export const reorderAthletes = authedProcedure
  .input(ReorderAthletesSchema)
  .handler(async ({ input }) => {
    return reorder(input.ids);
  });
