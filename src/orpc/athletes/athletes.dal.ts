import type { Prisma } from '@prisma/client';
import type { CreateAthleteDTO, UpdateAthleteDTO } from './athletes.dto';
import { prisma } from '@/lib/db';

export class AthleteDAL {
  static async findByGroupId(groupId: string) {
    return await prisma.athlete.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async findByTournamentId(tournamentId: string) {
    return await prisma.athlete.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async findAll(params: {
    where?: Prisma.AthleteWhereInput;
    orderBy?: Array<Prisma.AthleteOrderByWithRelationInput>;
    skip?: number;
    take?: number;
  }) {
    const { where, orderBy, skip, take } = params;

    const [data, total] = await Promise.all([
      prisma.athlete.findMany({
        where,
        orderBy: orderBy?.length ? orderBy : [{ createdAt: 'asc' }],
        skip,
        take,
      }),
      prisma.athlete.count({ where }),
    ]);

    return { data, total };
  }

  static async create(data: CreateAthleteDTO) {
    return await prisma.athlete.create({ data });
  }

  static async createMany(athletes: Array<CreateAthleteDTO>) {
    return await prisma.$transaction(
      athletes.map((athlete) => prisma.athlete.create({ data: athlete }))
    );
  }

  static async update(id: string, data: Omit<UpdateAthleteDTO, 'id'>) {
    return await prisma.athlete.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return await prisma.athlete.delete({ where: { id } });
  }

  static async deleteMany(ids: Array<string>) {
    return await prisma.$transaction(
      ids.map((id) => prisma.athlete.delete({ where: { id } }))
    );
  }

  static async reorder(ids: Array<string>) {
    return await prisma.$transaction(
      ids.map((id, index) =>
        prisma.athlete.update({
          where: { id },
          data: { order: index },
        })
      )
    );
  }
}

export const findByGroupId = (
  ...args: Parameters<typeof AthleteDAL.findByGroupId>
) => AthleteDAL.findByGroupId(...args);

export const findByTournamentId = (
  ...args: Parameters<typeof AthleteDAL.findByTournamentId>
) => AthleteDAL.findByTournamentId(...args);

export const findAll = (...args: Parameters<typeof AthleteDAL.findAll>) =>
  AthleteDAL.findAll(...args);

export const create = (...args: Parameters<typeof AthleteDAL.create>) =>
  AthleteDAL.create(...args);

export const createMany = (...args: Parameters<typeof AthleteDAL.createMany>) =>
  AthleteDAL.createMany(...args);

export const update = (...args: Parameters<typeof AthleteDAL.update>) =>
  AthleteDAL.update(...args);

export const deleteAthlete = (...args: Parameters<typeof AthleteDAL.delete>) =>
  AthleteDAL.delete(...args);

export const deleteAthletes = (
  ...args: Parameters<typeof AthleteDAL.deleteMany>
) => AthleteDAL.deleteMany(...args);

export const reorder = (...args: Parameters<typeof AthleteDAL.reorder>) =>
  AthleteDAL.reorder(...args);
