import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  Role,
} from '@prisma/client';

import {
  UsersController,
} from './users.controller';

import {
  UsersService,
} from './users.service';

describe(
  'UsersController',
  () => {
    let controller:
      UsersController;

    let usersService: {
      findAll:
        jest.Mock;

      findOne:
        jest.Mock;

      remove:
        jest.Mock;

      updateMe:
        jest.Mock;

      updateAvatar:
        jest.Mock;

      getProfileProgress:
        jest.Mock;

      getMyProfile:
        jest.Mock;
    };

    const buyerRequest = {
      user: {
        id:
          'buyer-1',

        role:
          Role.BUYER,
      },
    };

    const adminRequest = {
      user: {
        id:
          'admin-1',

        role:
          Role.ADMIN,
      },
    };

    beforeEach(
      async () => {
        usersService = {
          findAll:
            jest.fn(),

          findOne:
            jest.fn(),

          remove:
            jest.fn(),

          updateMe:
            jest.fn(),

          updateAvatar:
            jest.fn(),

          getProfileProgress:
            jest.fn(),

          getMyProfile:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              UsersController,
            ],

            providers: [
              {
                provide:
                  UsersService,

                useValue:
                  usersService,
              },
            ],
          }).compile();

        controller =
          module.get<UsersController>(
            UsersController,
          );
      },
    );

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
              controller,
            ).toBeDefined();
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
          'should return all users',
          async () => {
            const users = [
              {
                id:
                  'user-1',

                email:
                  'user@example.com',

                fullName:
                  'John Buyer',

                role:
                  Role.BUYER,
              },
            ];

            usersService
              .findAll
              .mockResolvedValue(
                users,
              );

            const result =
              await controller
                .findAll();

            expect(
              usersService
                .findAll,
            ).toHaveBeenCalledTimes(
              1,
            );

            expect(
              result,
            ).toEqual(
              users,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * ME
     * ============================================================
     */

    describe(
      'me',
      () => {
        it(
          'should return authenticated user',
          async () => {
            const user = {
              id:
                'buyer-1',

              email:
                'buyer@example.com',

              fullName:
                'Buyer Lisbon',

              role:
                Role.BUYER,
            };

            usersService
              .findOne
              .mockResolvedValue(
                user,
              );

            const result =
              await controller.me(
                buyerRequest as never,
              );

            expect(
              usersService
                .findOne,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );

            expect(
              result,
            ).toEqual(
              user,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PROFILE PROGRESS
     * ============================================================
     */

    describe(
      'getProfileProgress',
      () => {
        it(
          'should return authenticated user profile progress',
          async () => {
            const progress = {
              id:
                'buyer-1',

              profileCompletion:
                75,

              profileTier:
                'ACTIVE_BUYER',
            };

            usersService
              .getProfileProgress
              .mockResolvedValue(
                progress,
              );

            const result =
              await controller
                .getProfileProgress(
                  buyerRequest as never,
                );

            expect(
              usersService
                .getProfileProgress,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );

            expect(
              result,
            ).toEqual(
              progress,
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
          'should return user by id',
          async () => {
            const user = {
              id:
                'user-2',

              email:
                'another@example.com',
            };

            usersService
              .findOne
              .mockResolvedValue(
                user,
              );

            const result =
              await controller
                .findOne(
                  'user-2',
                );

            expect(
              usersService
                .findOne,
            ).toHaveBeenCalledWith(
              'user-2',
            );

            expect(
              result,
            ).toEqual(
              user,
            );
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
          'should forward target id and authenticated user id',
          async () => {
            usersService
              .remove
              .mockResolvedValue({
                message:
                  'User deleted successfully',
              });

            const result =
              await controller.remove(
                'user-2',
                adminRequest as never,
              );

            expect(
              usersService
                .remove,
            ).toHaveBeenCalledWith(
              'user-2',
              'admin-1',
            );

            expect(
              result,
            ).toEqual({
              message:
                'User deleted successfully',
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * UPDATE ME
     * ============================================================
     */

    describe(
      'updateMe',
      () => {
        it(
          'should update authenticated user',
          async () => {
            const dto = {
              fullName:
                'Updated Buyer',

              phone:
                '+351910000000',

              country:
                'Portugal',

              city:
                'Lisbon',

              avatarUrl:
                '/uploads/avatars/test.jpg',
            };

            const updatedUser = {
              id:
                'buyer-1',

              ...dto,
            };

            usersService
              .updateMe
              .mockResolvedValue(
                updatedUser,
              );

            const result =
              await controller
                .updateMe(
                  buyerRequest as never,
                  dto,
                );

            expect(
              usersService
                .updateMe,
            ).toHaveBeenCalledWith(
              'buyer-1',
              dto,
            );

            expect(
              result,
            ).toEqual(
              updatedUser,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * AVATAR
     * ============================================================
     */

    describe(
  'uploadAvatar',
  () => {
    it(
      'should validate file and update authenticated user avatar',
      async () => {
        const file: Express.Multer.File = {
          fieldname:
            'avatar',

          originalname:
            'avatar.jpg',

          encoding:
            '7bit',

          mimetype:
            'image/jpeg',

          size:
            1024,

          destination:
            './uploads/avatars',

          filename:
            'avatar-123.jpg',

          path:
            'uploads/avatars/avatar-123.jpg',

          buffer:
            Buffer.from(
              'fake-image-content',
            ),

          stream:
            null as never,
        };

        const updatedUser = {
          id:
            'buyer-1',

          email:
            'buyer@example.com',

          fullName:
            'Buyer Lisbon',

          role:
            Role.BUYER,

          phone:
            null,

          country:
            null,

          city:
            null,

          avatarUrl:
            '/uploads/avatars/avatar-123.jpg',
        };

        usersService
          .updateAvatar
          .mockResolvedValue(
            updatedUser,
          );

        const result =
          await controller
            .uploadAvatar(
              file,
              buyerRequest as never,
            );

        expect(
          usersService
            .updateAvatar,
        ).toHaveBeenCalledWith(
          'buyer-1',
          '/uploads/avatars/avatar-123.jpg',
        );

        expect(
          result,
        ).toEqual(
          updatedUser,
        );
      },
    );
  },
);

    /*
     * ============================================================
     * MY PROFILE
     * ============================================================
     */

    describe(
      'getMyProfile',
      () => {
        it(
          'should return complete authenticated buyer profile',
          async () => {
            const profile = {
              id:
                'buyer-1',

              fullName:
                'Buyer Lisbon',

              email:
                'buyer@example.com',

              profileCompletion:
                80,

              usedTools: [
                'Mortgage Calculator',
                'Property Search Assistant',
              ],

              totalRequests:
                2,

              totalMatches:
                1,

              nextSteps:
                [],

              journey: {
                accountCreated:
                  true,

                profileCompleted:
                  true,

                firstToolCompleted:
                  true,

                matchedWithProfessional:
                  true,

                contactedProfessional:
                  false,

                completedJourney:
                  false,
              },
            };

            usersService
              .getMyProfile
              .mockResolvedValue(
                profile,
              );

            const result =
              await controller
                .getMyProfile(
                  buyerRequest as never,
                );

            expect(
              usersService
                .getMyProfile,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );

            expect(
              result,
            ).toEqual(
              profile,
            );
          },
        );
      },
    );
  },
);