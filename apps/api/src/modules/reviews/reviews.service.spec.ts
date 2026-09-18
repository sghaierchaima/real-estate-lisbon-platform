import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  MatchStatus,
  ReviewStatus,
  Role,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  ReviewsService,
} from './reviews.service';

import {
  CreateReviewDto,
} from './dto/create-review.dto';

describe(
  'ReviewsService',
  () => {
    let service:
      ReviewsService;

    let prisma: {
      match: {
        findUnique:
          jest.Mock;
      };

      review: {
        create:
          jest.Mock;

        findMany:
          jest.Mock;

        findUnique:
          jest.Mock;

        update:
          jest.Mock;

        aggregate:
          jest.Mock;
      };

      professionalProfile: {
        findUnique:
          jest.Mock;

        update:
          jest.Mock;
      };
    };

    const buyerUser = {
      id:
        'buyer-1',

      role:
        Role.BUYER,
    };

    const anotherBuyer = {
      id:
        'buyer-2',

      role:
        Role.BUYER,
    };

    const adminUser = {
      id:
        'admin-1',

      role:
        Role.ADMIN,
    };

    const professionalUser = {
      id:
        'professional-user-1',

      role:
        Role.PROFESSIONAL,
    };

    const completedMatch = {
      id:
        'match-1',

      buyerId:
        'buyer-1',

      professionalId:
        'professional-1',

      status:
        MatchStatus.COMPLETED,

      buyer: {
        id:
          'buyer-1',

        fullName:
          'John Buyer',

        email:
          'john@example.com',

        role:
          Role.BUYER,
      },

      lead: {
        id:
          'lead-1',

        userId:
          'buyer-1',
      },

      professional: {
        id:
          'professional-1',

        user: {
          id:
            'professional-user-1',

          fullName:
            'Ana Costa',

          email:
            'ana@example.com',

          role:
            Role.PROFESSIONAL,
        },
      },

      review:
        null,
    };

    const pendingReview = {
      id:
        'review-1',

      rating:
        5,

      comment:
        'Excellent professional',

      status:
        ReviewStatus.PENDING,

      buyerId:
        'buyer-1',

      professionalId:
        'professional-1',

      matchId:
        'match-1',

      createdAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),

      updatedAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),
    };

    beforeEach(() => {
      prisma = {
        match: {
          findUnique:
            jest.fn(),
        },

        review: {
          create:
            jest.fn(),

          findMany:
            jest.fn(),

          findUnique:
            jest.fn(),

          update:
            jest.fn(),

          aggregate:
            jest.fn(),
        },

        professionalProfile: {
          findUnique:
            jest.fn(),

          update:
            jest.fn(),
        },
      };

      service =
        new ReviewsService(
          prisma as unknown as PrismaService,
        );
    });

    /*
     * ============================================================
     * INITIALIZATION
     * ============================================================
     */

    describe(
      'initialization',
      () => {
        it(
          'should be defined',
          () => {
            expect(
              service,
            ).toBeDefined();
          },
        );
      },
    );

    /*
     * ============================================================
     * CREATE
     * ============================================================
     */

    describe(
      'create',
      () => {
        const dto:
          CreateReviewDto = {
            matchId:
              'match-1',

            rating:
              5,

            comment:
              '  Excellent professional  ',
          };

        it(
          'should reject non buyer users',
          async () => {
            await expect(
              service.create(
                dto,
                professionalUser,
              ),
            ).rejects.toBeInstanceOf(
              ForbiddenException,
            );

            await expect(
              service.create(
                dto,
                professionalUser,
              ),
            ).rejects.toThrow(
              'Only buyers can review professionals',
            );

            expect(
              prisma.match
                .findUnique,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should throw when match does not exist',
          async () => {
            prisma.match
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.create(
                dto,
                buyerUser,
              ),
            ).rejects.toBeInstanceOf(
              NotFoundException,
            );

            await expect(
              service.create(
                dto,
                buyerUser,
              ),
            ).rejects.toThrow(
              'Match not found',
            );
          },
        );

        it(
          'should reject match when buyer cannot be identified',
          async () => {
            prisma.match
              .findUnique
              .mockResolvedValue({
                ...completedMatch,

                buyerId:
                  null,

                lead:
                  null,
              });

            await expect(
              service.create(
                dto,
                buyerUser,
              ),
            ).rejects.toThrow(
              'The buyer associated with this match could not be identified',
            );
          },
        );

        it(
          'should reject buyer reviewing another buyers match',
          async () => {
            prisma.match
              .findUnique
              .mockResolvedValue(
                completedMatch,
              );

            await expect(
              service.create(
                dto,
                anotherBuyer,
              ),
            ).rejects.toThrow(
              'You can only review your own completed matches',
            );
          },
        );

        it(
          'should accept legacy match buyer through lead userId',
          async () => {
            prisma.match
              .findUnique
              .mockResolvedValue({
                ...completedMatch,

                buyerId:
                  null,

                lead: {
                  id:
                    'lead-1',

                  userId:
                    'buyer-1',
                },
              });

            prisma.review
              .create
              .mockResolvedValue(
                pendingReview,
              );

            const result =
              await service.create(
                dto,
                buyerUser,
              );

            expect(
              result.review,
            ).toBeDefined();
          },
        );

        it(
          'should reject non completed match',
          async () => {
            prisma.match
              .findUnique
              .mockResolvedValue({
                ...completedMatch,

                status:
                  MatchStatus.ACTIVE,
              });

            await expect(
              service.create(
                dto,
                buyerUser,
              ),
            ).rejects.toBeInstanceOf(
              BadRequestException,
            );

            await expect(
              service.create(
                dto,
                buyerUser,
              ),
            ).rejects.toThrow(
              'Only completed matches can be reviewed',
            );
          },
        );

        it(
          'should reject duplicate review for same match',
          async () => {
            prisma.match
              .findUnique
              .mockResolvedValue({
                ...completedMatch,

                review:
                  pendingReview,
              });

            await expect(
              service.create(
                dto,
                buyerUser,
              ),
            ).rejects.toThrow(
              'A review has already been submitted for this match',
            );

            expect(
              prisma.review
                .create,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should create pending review with trimmed comment',
          async () => {
            prisma.match
              .findUnique
              .mockResolvedValue(
                completedMatch,
              );

            prisma.review
              .create
              .mockResolvedValue({
                ...pendingReview,

                comment:
                  'Excellent professional',
              });

            const result =
              await service.create(
                dto,
                buyerUser,
              );

            expect(
              prisma.review
                .create,
            ).toHaveBeenCalledWith({
              data: {
                rating:
                  5,

                comment:
                  'Excellent professional',

                status:
                  'PENDING',

                buyerId:
                  'buyer-1',

                professionalId:
                  'professional-1',

                matchId:
                  'match-1',
              },

              include: {
                buyer: {
                  select: {
                    id:
                      true,

                    fullName:
                      true,

                    avatarUrl:
                      true,
                  },
                },

                professional: {
                  include: {
                    user: {
                      select: {
                        id:
                          true,

                        fullName:
                          true,

                        email:
                          true,

                        avatarUrl:
                          true,
                      },
                    },
                  },
                },
              },
            });

            expect(
              result.message,
            ).toBe(
              'Review submitted and waiting for administrator approval',
            );
          },
        );

        it(
          'should store null comment when comment is empty',
          async () => {
            prisma.match
              .findUnique
              .mockResolvedValue(
                completedMatch,
              );

            prisma.review
              .create
              .mockResolvedValue({
                ...pendingReview,

                comment:
                  null,
              });

            await service.create(
              {
                ...dto,

                comment:
                  '   ',
              },
              buyerUser,
            );

            expect(
              prisma.review
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                data:
                  expect.objectContaining({
                    comment:
                      null,
                  }),
              }),
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND BY PROFESSIONAL
     * ============================================================
     */

    describe(
      'findByProfessional',
      () => {
        it(
          'should throw when professional does not exist',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service
                .findByProfessional(
                  'missing-professional',
                ),
            ).rejects.toThrow(
              'Professional not found',
            );

            expect(
              prisma.review
                .findMany,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should return only approved reviews',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue({
                id:
                  'professional-1',
              });

            prisma.review
              .findMany
              .mockResolvedValue([
                {
                  ...pendingReview,

                  status:
                    ReviewStatus.APPROVED,
                },
              ]);

            const result =
              await service
                .findByProfessional(
                  'professional-1',
                );

            expect(
              result,
            ).toHaveLength(
              1,
            );

            expect(
              prisma.review
                .findMany,
            ).toHaveBeenCalledWith({
              where: {
                professionalId:
                  'professional-1',

                status:
                  ReviewStatus.APPROVED,
              },

              orderBy: {
                createdAt:
                  'desc',
              },

              include: {
                buyer: {
                  select: {
                    id:
                      true,

                    fullName:
                      true,

                    avatarUrl:
                      true,
                  },
                },
              },
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND MY REVIEW
     * ============================================================
     */

    describe(
      'findMyReview',
      () => {
        it(
          'should reject non buyers',
          async () => {
            await expect(
              service.findMyReview(
                'match-1',
                professionalUser,
              ),
            ).rejects.toThrow(
              'Only buyers can access their reviews',
            );
          },
        );

        it(
          'should return null when review does not exist',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                null,
              );

            const result =
              await service.findMyReview(
                'match-1',
                buyerUser,
              );

            expect(
              result,
            ).toBeNull();
          },
        );

        it(
          'should reject access to another buyers review',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue({
                ...pendingReview,

                buyerId:
                  'buyer-2',
              });

            await expect(
              service.findMyReview(
                'match-1',
                buyerUser,
              ),
            ).rejects.toThrow(
              'You cannot access this review',
            );
          },
        );

        it(
          'should return buyers own review',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                pendingReview,
              );

            const result =
              await service.findMyReview(
                'match-1',
                buyerUser,
              );

            expect(
              result,
            ).toEqual(
              pendingReview,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * ADMIN FIND ALL
     * ============================================================
     */

    describe(
      'findAll',
      () => {
        it(
          'should reject non admins',
          async () => {
            await expect(
              service.findAll(
                buyerUser,
              ),
            ).rejects.toThrow(
              'Only administrators can view all reviews',
            );
          },
        );

        it(
          'should return all reviews for admin',
          async () => {
            prisma.review
              .findMany
              .mockResolvedValue([
                pendingReview,
              ]);

            const result =
              await service.findAll(
                adminUser,
              );

            expect(
              result,
            ).toEqual([
              pendingReview,
            ]);

            expect(
              prisma.review
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where:
                  undefined,

                orderBy: {
                  createdAt:
                    'desc',
                },
              }),
            );
          },
        );

        it(
          'should filter reviews by status',
          async () => {
            prisma.review
              .findMany
              .mockResolvedValue([
                pendingReview,
              ]);

            await service.findAll(
              adminUser,
              ReviewStatus.PENDING,
            );

            expect(
              prisma.review
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  status:
                    ReviewStatus.PENDING,
                },
              }),
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * APPROVE
     * ============================================================
     */

    describe(
      'approve',
      () => {
        it(
          'should reject non admin approval',
          async () => {
            await expect(
              service.approve(
                'review-1',
                buyerUser,
              ),
            ).rejects.toThrow(
              'Only administrators can approve reviews',
            );
          },
        );

        it(
          'should throw when review does not exist',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.approve(
                'missing-review',
                adminUser,
              ),
            ).rejects.toThrow(
              'Review not found',
            );
          },
        );

        it(
          'should reject non pending review',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue({
                ...pendingReview,

                status:
                  ReviewStatus.APPROVED,
              });

            await expect(
              service.approve(
                'review-1',
                adminUser,
              ),
            ).rejects.toThrow(
              'Only pending reviews can be approved',
            );

            expect(
              prisma.review
                .update,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should approve pending review',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                pendingReview,
              );

            prisma.review
              .update
              .mockResolvedValue({
                ...pendingReview,

                status:
                  ReviewStatus.APPROVED,
              });

            prisma.review
              .aggregate
              .mockResolvedValue({
                _avg: {
                  rating:
                    4.5,
                },

                _count: {
                  rating:
                    4,
                },
              });

            prisma
              .professionalProfile
              .update
              .mockResolvedValue({
                id:
                  'professional-1',

                rating:
                  4.5,

                reviewsCount:
                  4,
              });

            const result =
              await service.approve(
                'review-1',
                adminUser,
              );

            expect(
              prisma.review
                .update,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  id:
                    'review-1',
                },

                data: {
                  status:
                    ReviewStatus.APPROVED,
                },
              }),
            );

            expect(
              result.message,
            ).toBe(
              'Review approved successfully',
            );
          },
        );

        it(
          'should recalculate professional rating after approval',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                pendingReview,
              );

            prisma.review
              .update
              .mockResolvedValue({
                ...pendingReview,

                status:
                  ReviewStatus.APPROVED,
              });

            prisma.review
              .aggregate
              .mockResolvedValue({
                _avg: {
                  rating:
                    4.46,
                },

                _count: {
                  rating:
                    7,
                },
              });

            prisma
              .professionalProfile
              .update
              .mockResolvedValue({});

            await service.approve(
              'review-1',
              adminUser,
            );

            expect(
              prisma.review
                .aggregate,
            ).toHaveBeenCalledWith({
              where: {
                professionalId:
                  'professional-1',

                status:
                  'APPROVED',
              },

              _avg: {
                rating:
                  true,
              },

              _count: {
                rating:
                  true,
              },
            });

            expect(
              prisma
                .professionalProfile
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'professional-1',
              },

              data: {
                rating:
                  4.5,

                reviewsCount:
                  7,
              },
            });
          },
        );

        it(
          'should use zero rating when there are no approved ratings',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                pendingReview,
              );

            prisma.review
              .update
              .mockResolvedValue({
                ...pendingReview,

                status:
                  ReviewStatus.APPROVED,
              });

            prisma.review
              .aggregate
              .mockResolvedValue({
                _avg: {
                  rating:
                    null,
                },

                _count: {
                  rating:
                    0,
                },
              });

            prisma
              .professionalProfile
              .update
              .mockResolvedValue({});

            await service.approve(
              'review-1',
              adminUser,
            );

            expect(
              prisma
                .professionalProfile
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'professional-1',
              },

              data: {
                rating:
                  0,

                reviewsCount:
                  0,
              },
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * REJECT
     * ============================================================
     */

    describe(
      'reject',
      () => {
        it(
          'should reject non admin rejection',
          async () => {
            await expect(
              service.reject(
                'review-1',
                buyerUser,
              ),
            ).rejects.toThrow(
              'Only administrators can reject reviews',
            );
          },
        );

        it(
          'should throw when review does not exist',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.reject(
                'missing-review',
                adminUser,
              ),
            ).rejects.toThrow(
              'Review not found',
            );
          },
        );

        it(
          'should reject moderation of non pending review',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue({
                ...pendingReview,

                status:
                  ReviewStatus.REJECTED,
              });

            await expect(
              service.reject(
                'review-1',
                adminUser,
              ),
            ).rejects.toThrow(
              'Only pending reviews can be rejected',
            );
          },
        );

        it(
          'should reject pending review',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                pendingReview,
              );

            prisma.review
              .update
              .mockResolvedValue({
                ...pendingReview,

                status:
                  ReviewStatus.REJECTED,
              });

            prisma.review
              .aggregate
              .mockResolvedValue({
                _avg: {
                  rating:
                    4,
                },

                _count: {
                  rating:
                    3,
                },
              });

            prisma
              .professionalProfile
              .update
              .mockResolvedValue({});

            const result =
              await service.reject(
                'review-1',
                adminUser,
              );

            expect(
              prisma.review
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'review-1',
              },

              data: {
                status:
                  ReviewStatus.REJECTED,
              },
            });

            expect(
              result.message,
            ).toBe(
              'Review rejected successfully',
            );
          },
        );

        it(
          'should recalculate rating using only approved reviews after rejection',
          async () => {
            prisma.review
              .findUnique
              .mockResolvedValue(
                pendingReview,
              );

            prisma.review
              .update
              .mockResolvedValue({
                ...pendingReview,

                status:
                  ReviewStatus.REJECTED,
              });

            prisma.review
              .aggregate
              .mockResolvedValue({
                _avg: {
                  rating:
                    4.25,
                },

                _count: {
                  rating:
                    4,
                },
              });

            prisma
              .professionalProfile
              .update
              .mockResolvedValue({});

            await service.reject(
              'review-1',
              adminUser,
            );

            expect(
              prisma.review
                .aggregate,
            ).toHaveBeenCalledWith({
              where: {
                professionalId:
                  'professional-1',

                status:
                  'APPROVED',
              },

              _avg: {
                rating:
                  true,
              },

              _count: {
                rating:
                  true,
              },
            });

            expect(
              prisma
                .professionalProfile
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'professional-1',
              },

              data: {
                rating:
                  4.3,

                reviewsCount:
                  4,
              },
            });
          },
        );
      },
    );
  },
);