import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StoryStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateStoryStatusDto } from './dto/update-story-status.dto';

type AuthenticatedUser = {
  id: string;
  role: Role;
};

type CreateStoryData = {
  title: string;
  excerpt?: string;
  content?: string;
  author?: string;
  location?: string;
  imageUrl?: string;
};

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateStoryData,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.BUYER) {
      throw new ForbiddenException(
        'Only buyers can submit success stories',
      );
    }

    const buyer = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    const title = dto.title?.trim();

    if (!title) {
      throw new BadRequestException(
        'Story title is required',
      );
    }

    const story = await this.prisma.story.create({
      data: {
        title,
        excerpt: dto.excerpt?.trim() || null,
        content: dto.content?.trim() || null,

        // Le nom vient prioritairement du compte connecté.
        author:
          buyer.fullName ||
          dto.author?.trim() ||
          buyer.email,

        location: dto.location?.trim() || null,
        imageUrl: dto.imageUrl || null,

        // Une nouvelle story doit toujours attendre la modération.
        status: StoryStatus.PENDING,
        isVerified: false,
        userId: user.id,
      },
    });

    await this.auditService.log({
      userId: user.id,
      userRole: user.role,
      action: 'STORY_SUBMITTED',
      entity: 'Story',
      entityId: story.id,
      description: `Buyer submitted story ${story.id}`,
    });

    return story;
  }

  async findAll(user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return this.prisma.story.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      });
    }

    return this.prisma.story.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findApprovedPublic() {
    return this.prisma.story.findMany({
      where: {
        status: StoryStatus.APPROVED,
        isVerified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPublicOne(id: string) {
    const story = await this.prisma.story.findFirst({
      where: {
        id,
        status: StoryStatus.APPROVED,
        isVerified: true,
      },
    });

    if (!story) {
      throw new NotFoundException(
        'Published story not found',
      );
    }

    return story;
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const story = await this.prisma.story.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (
      user.role !== Role.ADMIN &&
      story.userId !== user.id
    ) {
      throw new ForbiddenException(
        'You can only access your own stories',
      );
    }

    return story;
  }

  async updateStatus(
    id: string,
    dto: UpdateStoryStatusDto,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can moderate stories',
      );
    }

    const story = await this.prisma.story.findUnique({
      where: {
        id,
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.status !== StoryStatus.PENDING) {
      throw new BadRequestException(
        'Only pending stories can be moderated',
      );
    }

    const updated = await this.prisma.story.update({
      where: {
        id,
      },
      data: {
        status: dto.status,

        // Une story approuvée devient visible publiquement.
        isVerified:
          dto.status === StoryStatus.APPROVED,
      },
    });

    await this.auditService.log({
      userId: user.id,
      userRole: user.role,
      action:
        dto.status === StoryStatus.APPROVED
          ? 'STORY_APPROVED'
          : 'STORY_REJECTED',
      entity: 'Story',
      entityId: story.id,
      description: `Admin changed story ${story.id} to ${dto.status}`,
    });

    return updated;
  }

  async remove(
    id: string,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can delete stories',
      );
    }

    const story = await this.prisma.story.findUnique({
      where: {
        id,
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    await this.prisma.story.delete({
      where: {
        id,
      },
    });

    await this.auditService.log({
      userId: user.id,
      userRole: user.role,
      action: 'STORY_DELETED',
      entity: 'Story',
      entityId: story.id,
      description: `Admin deleted story ${story.id}`,
    });

    return {
      message: 'Story deleted successfully',
    };
  }
}