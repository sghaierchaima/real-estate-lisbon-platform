import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    userRole?: Role;
    action: string;
    entity?: string;
    entityId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        userRole: params.userRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
  async findAll() {
  return this.prisma.auditLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });
}
}