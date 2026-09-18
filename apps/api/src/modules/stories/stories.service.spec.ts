import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  Role,
  StoryStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  AuditService,
} from '../audit/audit.service';

import {
  StoriesService,
} from './stories.service';

describe(
  'StoriesService',
  () => {
    let service:
      StoriesService;

    let prisma: {
      user: {
        findUnique:
          jest.Mock;
      };

      story: {
        create:
          jest.Mock;

        findMany:
          jest.Mock;

        findFirst:
          jest.Mock;

        findUnique:
          jest.Mock;

        update:
          jest.Mock;

        delete:
          jest.Mock;
      };
    };

    let auditService: {
      log:
        jest.Mock;
    };

    /*
     * ============================================================
     * USERS
     * ============================================================
     */

    const buyerUser = {
      id:
        'buyer-1',

      role:
        Role.BUYER,
    };

    const secondBuyerUser = {
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
        'professional-1',

      role:
        Role.PROFESSIONAL,
    };

    /*
     * ============================================================
     * BUYER
     * ============================================================
     */

    const buyer = {
      id:
        'buyer-1',

      fullName:
        'John Buyer',

      email:
        'john@example.com',
    };

    /*
     * ============================================================
     * BASE STORY
     * ============================================================
     */

    const baseStory = {
      id:
        'story-1',

      title:
        'My Lisbon Property Journey',

      excerpt:
        'A successful purchase experience',

      content:
        'This is my complete property buying story.',

      author:
        'John Buyer',

      location:
        'Lisbon',

      imageUrl:
        'https://example.com/story.jpg',

      status:
        StoryStatus.PENDING,

      isVerified:
        false,

      userId:
        'buyer-1',

      createdAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),

      updatedAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),
    };

    /*
     * ============================================================
     * SETUP
     * ============================================================
     */

    beforeEach(() => {
      prisma = {
        user: {
          findUnique:
            jest.fn(),
        },

        story: {
          create:
            jest.fn(),

          findMany:
            jest.fn(),

          findFirst:
            jest.fn(),

          findUnique:
            jest.fn(),

          update:
            jest.fn(),

          delete:
            jest.fn(),
        },
      };

      auditService = {
        log:
          jest.fn(),
      };

      service =
        new StoriesService(
          prisma as unknown as PrismaService,
          auditService as unknown as AuditService,
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
        const dto = {
          title:
            'My Lisbon Property Journey',

          excerpt:
            'A successful purchase experience',

          content:
            'This is my complete property buying story.',

          author:
            'Custom Author',

          location:
            'Lisbon',

          imageUrl:
            'https://example.com/story.jpg',
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
              'Only buyers can submit success stories',
            );

            expect(
              prisma.user
                .findUnique,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should throw when buyer does not exist',
          async () => {
            prisma.user
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
              'Buyer not found',
            );
          },
        );

        it(
          'should reject empty story title',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            await expect(
              service.create(
                {
                  ...dto,

                  title:
                    '   ',
                },
                buyerUser,
              ),
            ).rejects.toBeInstanceOf(
              BadRequestException,
            );

            await expect(
              service.create(
                {
                  ...dto,

                  title:
                    '   ',
                },
                buyerUser,
              ),
            ).rejects.toThrow(
              'Story title is required',
            );
          },
        );

        it(
          'should create a pending unverified story',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.story
              .create
              .mockResolvedValue(
                baseStory,
              );

            const result =
              await service.create(
                dto,
                buyerUser,
              );

            expect(
              prisma.story
                .create,
            ).toHaveBeenCalledWith({
              data: {
                title:
                  'My Lisbon Property Journey',

                excerpt:
                  'A successful purchase experience',

                content:
                  'This is my complete property buying story.',

                author:
                  'John Buyer',

                location:
                  'Lisbon',

                imageUrl:
                  'https://example.com/story.jpg',

                status:
                  StoryStatus.PENDING,

                isVerified:
                  false,

                userId:
                  'buyer-1',
              },
            });

            expect(
              result.status,
            ).toBe(
              StoryStatus.PENDING,
            );

            expect(
              result.isVerified,
            ).toBe(
              false,
            );
          },
        );

        it(
          'should prefer authenticated buyer fullName as author',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.story
              .create
              .mockResolvedValue(
                baseStory,
              );

            await service.create(
              {
                ...dto,

                author:
                  'Different Author',
              },
              buyerUser,
            );

            expect(
              prisma.story
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                data:
                  expect.objectContaining({
                    author:
                      'John Buyer',
                  }),
              }),
            );
          },
        );

        it(
          'should fallback to dto author when buyer fullName is missing',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                ...buyer,

                fullName:
                  null,
              });

            prisma.story
              .create
              .mockResolvedValue({
                ...baseStory,

                author:
                  'Custom Author',
              });

            await service.create(
              dto,
              buyerUser,
            );

            expect(
              prisma.story
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                data:
                  expect.objectContaining({
                    author:
                      'Custom Author',
                  }),
              }),
            );
          },
        );

        it(
          'should fallback to buyer email when fullName and dto author are missing',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                ...buyer,

                fullName:
                  null,
              });

            prisma.story
              .create
              .mockResolvedValue({
                ...baseStory,

                author:
                  'john@example.com',
              });

            await service.create(
              {
                title:
                  'My Story',
              },
              buyerUser,
            );

            expect(
              prisma.story
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                data:
                  expect.objectContaining({
                    author:
                      'john@example.com',
                  }),
              }),
            );
          },
        );

        it(
          'should trim text fields',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.story
              .create
              .mockResolvedValue(
                baseStory,
              );

            await service.create(
              {
                title:
                  '  My Story  ',

                excerpt:
                  '  Short text  ',

                content:
                  '  Full content  ',

                location:
                  '  Lisbon  ',
              },
              buyerUser,
            );

            expect(
              prisma.story
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                data:
                  expect.objectContaining({
                    title:
                      'My Story',

                    excerpt:
                      'Short text',

                    content:
                      'Full content',

                    location:
                      'Lisbon',
                  }),
              }),
            );
          },
        );

        it(
          'should write STORY_SUBMITTED audit event',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.story
              .create
              .mockResolvedValue(
                baseStory,
              );

            await service.create(
              dto,
              buyerUser,
            );

            expect(
              auditService.log,
            ).toHaveBeenCalledWith({
              userId:
                'buyer-1',

              userRole:
                Role.BUYER,

              action:
                'STORY_SUBMITTED',

              entity:
                'Story',

              entityId:
                'story-1',

              description:
                'Buyer submitted story story-1',
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND ALL
     * ============================================================
     */

    describe(
      'findAll',
      () => {
        it(
          'should return all stories for admin',
          async () => {
            prisma.story
              .findMany
              .mockResolvedValue([
                baseStory,
              ]);

            const result =
              await service.findAll(
                adminUser,
              );

            expect(
              result,
            ).toEqual([
              baseStory,
            ]);

            expect(
              prisma.story
                .findMany,
            ).toHaveBeenCalledWith({
              orderBy: {
                createdAt:
                  'desc',
              },

              include: {
                user: {
                  select: {
                    id:
                      true,

                    fullName:
                      true,

                    email:
                      true,

                    role:
                      true,
                  },
                },
              },
            });
          },
        );

        it(
          'should return only own stories for buyer',
          async () => {
            prisma.story
              .findMany
              .mockResolvedValue([
                baseStory,
              ]);

            const result =
              await service.findAll(
                buyerUser,
              );

            expect(
              result,
            ).toEqual([
              baseStory,
            ]);

            expect(
              prisma.story
                .findMany,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',
              },

              orderBy: {
                createdAt:
                  'desc',
              },
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * PUBLIC STORIES
     * ============================================================
     */

    describe(
      'findApprovedPublic',
      () => {
        it(
          'should return only approved and verified stories',
          async () => {
            prisma.story
              .findMany
              .mockResolvedValue([
                {
                  ...baseStory,

                  status:
                    StoryStatus.APPROVED,

                  isVerified:
                    true,
                },
              ]);

            const result =
              await service
                .findApprovedPublic();

            expect(
              result,
            ).toHaveLength(
              1,
            );

            expect(
              prisma.story
                .findMany,
            ).toHaveBeenCalledWith({
              where: {
                status:
                  StoryStatus.APPROVED,

                isVerified:
                  true,
              },

              orderBy: {
                createdAt:
                  'desc',
              },
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * PUBLIC STORY DETAILS
     * ============================================================
     */

    describe(
      'findPublicOne',
      () => {
        it(
          'should return approved verified story',
          async () => {
            prisma.story
              .findFirst
              .mockResolvedValue({
                ...baseStory,

                status:
                  StoryStatus.APPROVED,

                isVerified:
                  true,
              });

            const result =
              await service
                .findPublicOne(
                  'story-1',
                );

            expect(
              result.id,
            ).toBe(
              'story-1',
            );

            expect(
              prisma.story
                .findFirst,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'story-1',

                status:
                  StoryStatus.APPROVED,

                isVerified:
                  true,
              },
            });
          },
        );

        it(
          'should throw when published story does not exist',
          async () => {
            prisma.story
              .findFirst
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findPublicOne(
                'missing-story',
              ),
            ).rejects.toThrow(
              'Published story not found',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND ONE
     * ============================================================
     */

    describe(
      'findOne',
      () => {
        it(
          'should return story to its owner',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            const result =
              await service.findOne(
                'story-1',
                buyerUser,
              );

            expect(
              result,
            ).toEqual(
              baseStory,
            );
          },
        );

        it(
          'should allow admin to access any story',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            const result =
              await service.findOne(
                'story-1',
                adminUser,
              );

            expect(
              result,
            ).toEqual(
              baseStory,
            );
          },
        );

        it(
          'should throw when story does not exist',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findOne(
                'missing-story',
                buyerUser,
              ),
            ).rejects.toThrow(
              'Story not found',
            );
          },
        );

        it(
          'should reject access to another buyers story',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            await expect(
              service.findOne(
                'story-1',
                secondBuyerUser,
              ),
            ).rejects.toThrow(
              'You can only access your own stories',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * MODERATION
     * ============================================================
     */

    describe(
      'updateStatus',
      () => {
        it(
          'should reject non admin moderation',
          async () => {
            await expect(
              service.updateStatus(
                'story-1',
                {
                  status:
                    StoryStatus.APPROVED,
                },
                buyerUser,
              ),
            ).rejects.toThrow(
              'Only administrators can moderate stories',
            );

            expect(
              prisma.story
                .findUnique,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should throw when story does not exist',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.updateStatus(
                'missing-story',
                {
                  status:
                    StoryStatus.APPROVED,
                },
                adminUser,
              ),
            ).rejects.toThrow(
              'Story not found',
            );
          },
        );

        it(
          'should reject moderation of non pending story',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue({
                ...baseStory,

                status:
                  StoryStatus.APPROVED,
              });

            await expect(
              service.updateStatus(
                'story-1',
                {
                  status:
                    StoryStatus.REJECTED,
                },
                adminUser,
              ),
            ).rejects.toThrow(
              'Only pending stories can be moderated',
            );

            expect(
              prisma.story
                .update,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should approve story and set isVerified true',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            prisma.story
              .update
              .mockResolvedValue({
                ...baseStory,

                status:
                  StoryStatus.APPROVED,

                isVerified:
                  true,
              });

            const result =
              await service.updateStatus(
                'story-1',
                {
                  status:
                    StoryStatus.APPROVED,
                },
                adminUser,
              );

            expect(
              prisma.story
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'story-1',
              },

              data: {
                status:
                  StoryStatus.APPROVED,

                isVerified:
                  true,
              },
            });

            expect(
              result.status,
            ).toBe(
              StoryStatus.APPROVED,
            );

            expect(
              result.isVerified,
            ).toBe(
              true,
            );
          },
        );

        it(
          'should reject story and set isVerified false',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            prisma.story
              .update
              .mockResolvedValue({
                ...baseStory,

                status:
                  StoryStatus.REJECTED,

                isVerified:
                  false,
              });

            const result =
              await service.updateStatus(
                'story-1',
                {
                  status:
                    StoryStatus.REJECTED,
                },
                adminUser,
              );

            expect(
              prisma.story
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'story-1',
              },

              data: {
                status:
                  StoryStatus.REJECTED,

                isVerified:
                  false,
              },
            });

            expect(
              result.isVerified,
            ).toBe(
              false,
            );
          },
        );

        it(
          'should log STORY_APPROVED audit event',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            prisma.story
              .update
              .mockResolvedValue({
                ...baseStory,

                status:
                  StoryStatus.APPROVED,

                isVerified:
                  true,
              });

            await service.updateStatus(
              'story-1',
              {
                status:
                  StoryStatus.APPROVED,
              },
              adminUser,
            );

            expect(
              auditService.log,
            ).toHaveBeenCalledWith({
              userId:
                'admin-1',

              userRole:
                Role.ADMIN,

              action:
                'STORY_APPROVED',

              entity:
                'Story',

              entityId:
                'story-1',

              description:
                'Admin changed story story-1 to APPROVED',
            });
          },
        );

        it(
          'should log STORY_REJECTED audit event',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            prisma.story
              .update
              .mockResolvedValue({
                ...baseStory,

                status:
                  StoryStatus.REJECTED,

                isVerified:
                  false,
              });

            await service.updateStatus(
              'story-1',
              {
                status:
                  StoryStatus.REJECTED,
              },
              adminUser,
            );

            expect(
              auditService.log,
            ).toHaveBeenCalledWith({
              userId:
                'admin-1',

              userRole:
                Role.ADMIN,

              action:
                'STORY_REJECTED',

              entity:
                'Story',

              entityId:
                'story-1',

              description:
                'Admin changed story story-1 to REJECTED',
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * REMOVE
     * ============================================================
     */

    describe(
      'remove',
      () => {
        it(
          'should reject non admin deletion',
          async () => {
            await expect(
              service.remove(
                'story-1',
                buyerUser,
              ),
            ).rejects.toThrow(
              'Only administrators can delete stories',
            );

            expect(
              prisma.story
                .delete,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should throw when story does not exist',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.remove(
                'missing-story',
                adminUser,
              ),
            ).rejects.toThrow(
              'Story not found',
            );
          },
        );

        it(
          'should delete story',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            prisma.story
              .delete
              .mockResolvedValue(
                baseStory,
              );

            const result =
              await service.remove(
                'story-1',
                adminUser,
              );

            expect(
              prisma.story
                .delete,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'story-1',
              },
            });

            expect(
              result,
            ).toEqual({
              message:
                'Story deleted successfully',
            });
          },
        );

        it(
          'should log STORY_DELETED audit event',
          async () => {
            prisma.story
              .findUnique
              .mockResolvedValue(
                baseStory,
              );

            prisma.story
              .delete
              .mockResolvedValue(
                baseStory,
              );

            await service.remove(
              'story-1',
              adminUser,
            );

            expect(
              auditService.log,
            ).toHaveBeenCalledWith({
              userId:
                'admin-1',

              userRole:
                Role.ADMIN,

              action:
                'STORY_DELETED',

              entity:
                'Story',

              entityId:
                'story-1',

              description:
                'Admin deleted story story-1',
            });
          },
        );
      },
    );
  },
);