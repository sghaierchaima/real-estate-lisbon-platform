import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  NotificationType,
  Role,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  NotificationsService,
} from './notifications.service';

describe(
  'NotificationsService',
  () => {
    let service:
      NotificationsService;

    let prisma: {
      user: {
        findUnique:
          jest.Mock;
      };

      notification: {
        create:
          jest.Mock;

        findMany:
          jest.Mock;

        count:
          jest.Mock;

        findFirst:
          jest.Mock;

        update:
          jest.Mock;

        updateMany:
          jest.Mock;

        delete:
          jest.Mock;
      };
    };

    const buyerUser = {
      id:
        'buyer-1',

      role:
        Role.BUYER,
    };

    const baseNotification = {
      id:
        'notification-1',

      userId:
        'buyer-1',

      title:
        'New property match',

      message:
        'A property matches your saved search.',

      type:
        NotificationType.PROPERTY_MATCH,

      isRead:
        false,

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
        user: {
          findUnique:
            jest.fn(),
        },

        notification: {
          create:
            jest.fn(),

          findMany:
            jest.fn(),

          count:
            jest.fn(),

          findFirst:
            jest.fn(),

          update:
            jest.fn(),

          updateMany:
            jest.fn(),

          delete:
            jest.fn(),
        },
      };

      service =
        new NotificationsService(
          prisma as unknown as PrismaService,
        );
    });

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

    describe(
      'create',
      () => {
        it(
          'should reject empty title',
          async () => {
            await expect(
              service.create({
                userId:
                  'buyer-1',

                title:
                  '   ',

                message:
                  'Test message',

                type:
                  NotificationType.SYSTEM,
              }),
            ).rejects
              .toBeInstanceOf(
                BadRequestException,
              );

            await expect(
              service.create({
                userId:
                  'buyer-1',

                title:
                  '   ',

                message:
                  'Test message',

                type:
                  NotificationType.SYSTEM,
              }),
            ).rejects.toThrow(
              'Notification title is required',
            );

            expect(
              prisma.user
                .findUnique,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should reject empty message',
          async () => {
            await expect(
              service.create({
                userId:
                  'buyer-1',

                title:
                  'Test title',

                message:
                  '   ',

                type:
                  NotificationType.SYSTEM,
              }),
            ).rejects
              .toBeInstanceOf(
                BadRequestException,
              );

            await expect(
              service.create({
                userId:
                  'buyer-1',

                title:
                  'Test title',

                message:
                  '   ',

                type:
                  NotificationType.SYSTEM,
              }),
            ).rejects.toThrow(
              'Notification message is required',
            );

            expect(
              prisma.user
                .findUnique,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should throw when recipient does not exist',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.create({
                userId:
                  'missing-user',

                title:
                  'Test title',

                message:
                  'Test message',

                type:
                  NotificationType.SYSTEM,
              }),
            ).rejects
              .toBeInstanceOf(
                NotFoundException,
              );

            await expect(
              service.create({
                userId:
                  'missing-user',

                title:
                  'Test title',

                message:
                  'Test message',

                type:
                  NotificationType.SYSTEM,
              }),
            ).rejects.toThrow(
              'Notification recipient not found',
            );
          },
        );

        it(
          'should create notification with trimmed title and message',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',
              });

            prisma.notification
              .create
              .mockResolvedValue(
                baseNotification,
              );

            const result =
              await service.create({
                userId:
                  'buyer-1',

                title:
                  '  New property match  ',

                message:
                  '  A property matches your saved search.  ',

                type:
                  NotificationType.PROPERTY_MATCH,
              });

            expect(
              prisma.notification
                .create,
            ).toHaveBeenCalledWith({
              data: {
                userId:
                  'buyer-1',

                title:
                  'New property match',

                message:
                  'A property matches your saved search.',

                type:
                  NotificationType.PROPERTY_MATCH,
              },
            });

            expect(
              result,
            ).toEqual(
              baseNotification,
            );
          },
        );
      },
    );

    describe(
      'findAll',
      () => {
        it(
          'should return all notifications by default',
          async () => {
            prisma.notification
              .findMany
              .mockResolvedValue([
                baseNotification,
              ]);

            const result =
              await service.findAll(
                buyerUser,
              );

            expect(
              result,
            ).toEqual([
              baseNotification,
            ]);

            expect(
              prisma.notification
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

        it(
          'should return only unread notifications',
          async () => {
            prisma.notification
              .findMany
              .mockResolvedValue([
                baseNotification,
              ]);

            await service.findAll(
              buyerUser,
              'unread',
            );

            expect(
              prisma.notification
                .findMany,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',

                isRead:
                  false,
              },

              orderBy: {
                createdAt:
                  'desc',
              },
            });
          },
        );

        it(
          'should return only read notifications',
          async () => {
            prisma.notification
              .findMany
              .mockResolvedValue([
                {
                  ...baseNotification,

                  isRead:
                    true,
                },
              ]);

            await service.findAll(
              buyerUser,
              'read',
            );

            expect(
              prisma.notification
                .findMany,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',

                isRead:
                  true,
              },

              orderBy: {
                createdAt:
                  'desc',
              },
            });
          },
        );

        it(
          'should reject invalid filter',
          async () => {
            await expect(
              service.findAll(
                buyerUser,
                'invalid' as
                  | 'all'
                  | 'read'
                  | 'unread',
              ),
            ).rejects.toThrow(
              'Filter must be all, read or unread',
            );

            expect(
              prisma.notification
                .findMany,
            ).not
              .toHaveBeenCalled();
          },
        );
      },
    );

    describe(
      'unreadCount',
      () => {
        it(
          'should return unread notification count',
          async () => {
            prisma.notification
              .count
              .mockResolvedValue(
                5,
              );

            const result =
              await service.unreadCount(
                buyerUser,
              );

            expect(
              prisma.notification
                .count,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',

                isRead:
                  false,
              },
            });

            expect(
              result,
            ).toEqual({
              count:
                5,
            });
          },
        );
      },
    );

    describe(
      'markAsRead',
      () => {
        it(
          'should throw when notification does not exist for user',
          async () => {
            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            await expect(
              service.markAsRead(
                'missing-notification',
                buyerUser,
              ),
            ).rejects.toBeInstanceOf(
              NotFoundException,
            );

            await expect(
              service.markAsRead(
                'missing-notification',
                buyerUser,
              ),
            ).rejects.toThrow(
              'Notification not found',
            );
          },
        );

        it(
          'should return notification directly when already read',
          async () => {
            const readNotification = {
              ...baseNotification,

              isRead:
                true,
            };

            prisma.notification
              .findFirst
              .mockResolvedValue(
                readNotification,
              );

            const result =
              await service.markAsRead(
                'notification-1',
                buyerUser,
              );

            expect(
              result,
            ).toEqual(
              readNotification,
            );

            expect(
              prisma.notification
                .update,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should mark unread notification as read',
          async () => {
            prisma.notification
              .findFirst
              .mockResolvedValue(
                baseNotification,
              );

            prisma.notification
              .update
              .mockResolvedValue({
                ...baseNotification,

                isRead:
                  true,
              });

            const result =
              await service.markAsRead(
                'notification-1',
                buyerUser,
              );

            expect(
              prisma.notification
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'notification-1',
              },

              data: {
                isRead:
                  true,
              },
            });

            expect(
              result.isRead,
            ).toBe(
              true,
            );
          },
        );
      },
    );

    describe(
      'markAllAsRead',
      () => {
        it(
          'should mark all unread notifications as read',
          async () => {
            prisma.notification
              .updateMany
              .mockResolvedValue({
                count:
                  4,
              });

            const result =
              await service
                .markAllAsRead(
                  buyerUser,
                );

            expect(
              prisma.notification
                .updateMany,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',

                isRead:
                  false,
              },

              data: {
                isRead:
                  true,
              },
            });

            expect(
              result,
            ).toEqual({
              message:
                'All notifications marked as read',

              updatedCount:
                4,
            });
          },
        );

        it(
          'should return zero when no unread notification exists',
          async () => {
            prisma.notification
              .updateMany
              .mockResolvedValue({
                count:
                  0,
              });

            const result =
              await service
                .markAllAsRead(
                  buyerUser,
                );

            expect(
              result.updatedCount,
            ).toBe(
              0,
            );
          },
        );
      },
    );

    describe(
      'remove',
      () => {
        it(
          'should throw when notification does not belong to user',
          async () => {
            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            await expect(
              service.remove(
                'notification-1',
                buyerUser,
              ),
            ).rejects.toThrow(
              'Notification not found',
            );

            expect(
              prisma.notification
                .delete,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should delete owned notification',
          async () => {
            prisma.notification
              .findFirst
              .mockResolvedValue(
                baseNotification,
              );

            prisma.notification
              .delete
              .mockResolvedValue(
                baseNotification,
              );

            const result =
              await service.remove(
                'notification-1',
                buyerUser,
              );

            expect(
              prisma.notification
                .delete,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'notification-1',
              },
            });

            expect(
              result,
            ).toEqual({
              message:
                'Notification deleted successfully',
            });
          },
        );
      },
    );
  },
);