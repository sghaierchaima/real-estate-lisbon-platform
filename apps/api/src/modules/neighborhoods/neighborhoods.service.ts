import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NeighborhoodsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.neighborhood.findMany({
      orderBy: [{ aiScore: 'desc' }, { pricePerSqm: 'asc' }],
    });
  }

  async findOne(id: string) {
    const neighborhood = await this.prisma.neighborhood.findUnique({
      where: { id },
    });

    if (!neighborhood) {
      throw new NotFoundException('Neighborhood not found');
    }

    return neighborhood;
  }

  recommend(query: {
    budgetMax?: string;
    profile?: string;
    goal?: string;
    search?: string;
  }) {
    const budgetMax = query.budgetMax ? Number(query.budgetMax) : undefined;

    return this.prisma.neighborhood.findMany({
      where: {
        ...(budgetMax
          ? {
              avgPrice: {
                lte: budgetMax,
              },
            }
          : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { zone: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ aiScore: 'desc' }, { rentYield: 'desc' }],
      take: 10,
    });
  }
}