import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  Role,
} from '@prisma/client';

import {
  PropertiesController,
} from './properties.controller';

import {
  PropertiesService,
} from './properties.service';

import {
  CloudinaryService,
} from '../../common/cloudinary/cloudinary.service';

describe(
  'PropertiesController',
  () => {
    let controller:
      PropertiesController;

    let propertiesService: {
      findAll:
        jest.Mock;

      findPublic:
        jest.Mock;

      findPublicOne:
        jest.Mock;

      findOne:
        jest.Mock;

      create:
        jest.Mock;

      update:
        jest.Mock;

      remove:
        jest.Mock;
    };

    let cloudinaryService: {
      uploadPropertyImage:
        jest.Mock;
    };

    const professionalRequest = {
      user: {
        id:
          'professional-user-1',

        role:
          Role.PROFESSIONAL,
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
        propertiesService = {
          findAll:
            jest.fn(),

          findPublic:
            jest.fn(),

          findPublicOne:
            jest.fn(),

          findOne:
            jest.fn(),

          create:
            jest.fn(),

          update:
            jest.fn(),

          remove:
            jest.fn(),
        };

        cloudinaryService = {
          uploadPropertyImage:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              PropertiesController,
            ],

            providers: [
              {
                provide:
                  PropertiesService,

                useValue:
                  propertiesService,
              },

              {
                provide:
                  CloudinaryService,

                useValue:
                  cloudinaryService,
              },
            ],
          }).compile();

        controller =
          module.get<PropertiesController>(
            PropertiesController,
          );
      },
    );

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

    describe(
      'findAll',
      () => {
        it(
          'should forward authenticated user to PropertiesService',
          async () => {
            const properties = [
              {
                id:
                  'property-1',
              },
            ];

            propertiesService
              .findAll
              .mockResolvedValue(
                properties,
              );

            const result =
              await controller.findAll(
                adminRequest as never,
              );

            expect(
              propertiesService
                .findAll,
            ).toHaveBeenCalledWith(
              adminRequest.user,
            );

            expect(
              result,
            ).toEqual(
              properties,
            );
          },
        );
      },
    );

    describe(
      'findPublic',
      () => {
        it(
          'should return public properties',
          async () => {
            const properties = [
              {
                id:
                  'property-1',

                status:
                  'PUBLISHED',
              },
            ];

            propertiesService
              .findPublic
              .mockResolvedValue(
                properties,
              );

            const result =
              await controller
                .findPublic();

            expect(
              propertiesService
                .findPublic,
            ).toHaveBeenCalledTimes(
              1,
            );

            expect(
              result,
            ).toEqual(
              properties,
            );
          },
        );
      },
    );

    describe(
      'findPublicOne',
      () => {
        it(
          'should forward public property id',
          async () => {
            const property = {
              id:
                'property-1',
            };

            propertiesService
              .findPublicOne
              .mockResolvedValue(
                property,
              );

            const result =
              await controller
                .findPublicOne(
                  'property-1',
                );

            expect(
              propertiesService
                .findPublicOne,
            ).toHaveBeenCalledWith(
              'property-1',
            );

            expect(
              result,
            ).toEqual(
              property,
            );
          },
        );
      },
    );

    describe(
      'findOne',
      () => {
        it(
          'should forward property id and authenticated user',
          async () => {
            const property = {
              id:
                'property-1',
            };

            propertiesService
              .findOne
              .mockResolvedValue(
                property,
              );

            const result =
              await controller.findOne(
                'property-1',
                professionalRequest as never,
              );

            expect(
              propertiesService
                .findOne,
            ).toHaveBeenCalledWith(
              'property-1',
              professionalRequest.user,
            );

            expect(
              result,
            ).toEqual(
              property,
            );
          },
        );
      },
    );

    describe(
      'create',
      () => {
        it(
          'should upload files to Cloudinary and create property',
          async () => {
            const files = [
              {
                originalname:
                  'image-1.jpg',

                mimetype:
                  'image/jpeg',

                size:
                  1024,
              },

              {
                originalname:
                  'image-2.jpg',

                mimetype:
                  'image/jpeg',

                size:
                  2048,
              },
            ] as Express.Multer.File[];

            cloudinaryService
              .uploadPropertyImage
              .mockResolvedValueOnce({
                secure_url:
                  'https://cloudinary.com/property-1.jpg',
              })
              .mockResolvedValueOnce({
                secure_url:
                  'https://cloudinary.com/property-2.jpg',
              });

            const body = {
              title:
                'Lisbon Apartment',

              description:
                'Modern apartment',

              location:
                'Lisbon',

              region:
                'Lisboa',

              city:
                'Lisbon',

              price:
                '350000',

              propertyType:
                'Apartment',

              status:
                'PUBLISHED',

              featured:
                'true',

              bedrooms:
                '2',

              bathrooms:
                '2',

              area:
                '100',

              landArea:
                '0',

              constructionYear:
                '2024',

              equipments:
                JSON.stringify([
                  'Balcony',
                  'Parking',
                ]),
            };

            const created = {
              id:
                'property-1',

              title:
                'Lisbon Apartment',
            };

            propertiesService
              .create
              .mockResolvedValue(
                created,
              );

            const result =
              await controller.create(
                files,
                body,
                professionalRequest as never,
              );

            expect(
              cloudinaryService
                .uploadPropertyImage,
            ).toHaveBeenCalledTimes(
              2,
            );

            expect(
              propertiesService
                .create,
            ).toHaveBeenCalledWith(
              {
                title:
                  'Lisbon Apartment',

                description:
                  'Modern apartment',

                location:
                  'Lisbon',

                region:
                  'Lisboa',

                city:
                  'Lisbon',

                price:
                  350000,

                propertyType:
                  'Apartment',

                status:
                  'PUBLISHED',

                featured:
                  true,

                bedrooms:
                  2,

                bathrooms:
                  2,

                area:
                  100,

                landArea:
                  0,

                constructionYear:
                  2024,

                equipments: [
                  'Balcony',
                  'Parking',
                ],

                imageUrls: [
                  'https://cloudinary.com/property-1.jpg',
                  'https://cloudinary.com/property-2.jpg',
                ],
              },

              professionalRequest.user,
            );

            expect(
              result,
            ).toEqual(
              created,
            );
          },
        );

        it(
          'should create property without images',
          async () => {
            const body = {
              title:
                'Property',

              price:
                '200000',
            };

            propertiesService
              .create
              .mockResolvedValue({
                id:
                  'property-1',
              });

            await controller.create(
              [],
              body,
              professionalRequest as never,
            );

            expect(
              cloudinaryService
                .uploadPropertyImage,
            ).not
              .toHaveBeenCalled();

            expect(
              propertiesService
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                imageUrls:
                  [],
              }),

              professionalRequest.user,
            );
          },
        );
      },
    );

    describe(
      'update',
      () => {
        it(
          'should merge existing and newly uploaded image URLs',
          async () => {
            const files = [
              {
                originalname:
                  'new-image.jpg',

                mimetype:
                  'image/jpeg',

                size:
                  1024,
              },
            ] as Express.Multer.File[];

            cloudinaryService
              .uploadPropertyImage
              .mockResolvedValue({
                secure_url:
                  'https://cloudinary.com/new-image.jpg',
              });

            const body = {
              title:
                'Updated Property',

              price:
                '400000',

              featured:
                'false',

              bedrooms:
                '3',

              bathrooms:
                '2',

              area:
                '120',

              landArea:
                '0',

              constructionYear:
                '2020',

              equipments:
                JSON.stringify([
                  'Elevator',
                ]),

              existingImageUrls:
                JSON.stringify([
                  'https://cloudinary.com/old-image.jpg',
                ]),
            };

            const updated = {
              id:
                'property-1',

              title:
                'Updated Property',
            };

            propertiesService
              .update
              .mockResolvedValue(
                updated,
              );

            const result =
              await controller.update(
                'property-1',
                files,
                body,
                professionalRequest as never,
              );

            expect(
              propertiesService
                .update,
            ).toHaveBeenCalledWith(
              'property-1',

              expect.objectContaining({
                title:
                  'Updated Property',

                price:
                  400000,

                featured:
                  false,

                bedrooms:
                  3,

                bathrooms:
                  2,

                area:
                  120,

                equipments: [
                  'Elevator',
                ],

                imageUrls: [
                  'https://cloudinary.com/old-image.jpg',
                  'https://cloudinary.com/new-image.jpg',
                ],
              }),

              professionalRequest.user,
            );

            expect(
              result,
            ).toEqual(
              updated,
            );
          },
        );
      },
    );

    describe(
      'remove',
      () => {
        it(
          'should forward property id and authenticated user',
          async () => {
            propertiesService
              .remove
              .mockResolvedValue({
                message:
                  'Property deleted successfully',
              });

            const result =
              await controller.remove(
                'property-1',
                professionalRequest as never,
              );

            expect(
              propertiesService
                .remove,
            ).toHaveBeenCalledWith(
              'property-1',
              professionalRequest.user,
            );

            expect(
              result,
            ).toEqual({
              message:
                'Property deleted successfully',
            });
          },
        );
      },
    );
  },
);