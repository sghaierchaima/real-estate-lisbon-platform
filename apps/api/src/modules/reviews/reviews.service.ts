import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ReviewStatus,
  MatchStatus,
  Role,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateReviewDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (user.role !== Role.BUYER) {
      throw new ForbiddenException(
        'Only buyers can review professionals',
      );
    }

    const match =
      await this.prisma.match.findUnique({
        where: {
          id: dto.matchId,
        },

        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },

          lead: true,

          professional: {
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
          },

          review: true,
        },
      });

    if (!match) {
      throw new NotFoundException(
        'Match not found',
      );
    }

    /*
     * Un ancien match peut éventuellement
     * ne pas avoir buyerId, mais posséder
     * un lead lié à l’acheteur.
     */
    const matchBuyerId =
      match.buyerId ||
      match.lead?.userId;

    if (!matchBuyerId) {
      throw new BadRequestException(
        'The buyer associated with this match could not be identified',
      );
    }

    if (matchBuyerId !== user.id) {
      throw new ForbiddenException(
        'You can only review your own completed matches',
      );
    }

    if (
      match.status !==
      MatchStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Only completed matches can be reviewed',
      );
    }

    if (match.review) {
      throw new BadRequestException(
        'A review has already been submitted for this match',
      );
    }

    const cleanComment =
      dto.comment?.trim() || null;

    const review =
  await this.prisma.review.create({
    data: {
      rating: dto.rating,
      comment:
        dto.comment?.trim() || null,

      status: 'PENDING',

      buyerId: user.id,

      professionalId:
        match.professionalId,

      matchId: match.id,
    },

    include: {
      buyer: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },

      professional: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

return {
  message:
    'Review submitted and waiting for administrator approval',
  review,
};
  }

  async findByProfessional(
    professionalId: string,
  ) {
    const professional =
      await this.prisma.professionalProfile.findUnique({
        where: {
          id: professionalId,
        },

        select: {
          id: true,
        },
      });

    if (!professional) {
      throw new NotFoundException(
        'Professional not found',
      );
    }

    return this.prisma.review.findMany({
      where: {
        professionalId,
        status: ReviewStatus.APPROVED,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findMyReview(
    matchId: string,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (user.role !== Role.BUYER) {
      throw new ForbiddenException(
        'Only buyers can access their reviews',
      );
    }

    const review =
      await this.prisma.review.findUnique({
        where: {
          matchId,
        },

        include: {
          professional: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

    if (!review) {
      return null;
    }

    if (review.buyerId !== user.id) {
      throw new ForbiddenException(
        'You cannot access this review',
      );
    }

    return review;
  }



  private async recalculateProfessionalRating(
  professionalId: string,
) {
  const ratingStats =
    await this.prisma.review.aggregate({
      where: {
        professionalId,
        status: 'APPROVED',
      },

      _avg: {
        rating: true,
      },

      _count: {
        rating: true,
      },
    });

  const averageRating =
    ratingStats._avg.rating ?? 0;

  const roundedRating =
    Math.round(averageRating * 10) / 10;

  await this.prisma.professionalProfile.update({
    where: {
      id: professionalId,
    },

    data: {
      rating: roundedRating,

      // Dans ton projet, le champ s'appelle reviewsCount.
      reviewsCount:
        ratingStats._count.rating,
    },
  });
}

async findAll(
  user: {
    id: string;
    role: Role;
  },
  status?: ReviewStatus,
) {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenException(
      'Only administrators can view all reviews',
    );
  }

  return this.prisma.review.findMany({
    where: status
      ? {
          status,
        }
      : undefined,

    orderBy: {
      createdAt: 'desc',
    },

    include: {
      buyer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },

      professional: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },

      match: {
        select: {
          id: true,
          status: true,
          score: true,
          createdAt: true,
        },
      },
    },
  });
}

async approve(
  reviewId: string,
  user: {
    id: string;
    role: Role;
  },
) {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenException(
      'Only administrators can approve reviews',
    );
  }

  const existingReview =
    await this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

  if (!existingReview) {
    throw new NotFoundException(
      'Review not found',
    );
  }

  if (
    existingReview.status !==
    ReviewStatus.PENDING
  ) {
    throw new BadRequestException(
      'Only pending reviews can be approved',
    );
  }

  const review =
    await this.prisma.review.update({
      where: {
        id: reviewId,
      },

      data: {
        status: ReviewStatus.APPROVED,
      },

      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },

        professional: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

  await this.recalculateProfessionalRating(
    review.professionalId,
  );

  return {
    message:
      'Review approved successfully',
    review,
  };
}
async reject(
  reviewId: string,
  user: {
    id: string;
    role: Role;
  },
) {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenException(
      'Only administrators can reject reviews',
    );
  }

  const existingReview =
    await this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

  if (!existingReview) {
    throw new NotFoundException(
      'Review not found',
    );
  }

  if (
    existingReview.status !==
    ReviewStatus.PENDING
  ) {
    throw new BadRequestException(
      'Only pending reviews can be rejected',
    );
  }

  const review =
    await this.prisma.review.update({
      where: {
        id: reviewId,
      },

      data: {
        status: ReviewStatus.REJECTED,
      },
    });

  // Par sécurité, on recalcule quand même
  // uniquement avec les avis approuvés.
  await this.recalculateProfessionalRating(
    review.professionalId,
  );

  return {
    message:
      'Review rejected successfully',
    review,
  };
}
}