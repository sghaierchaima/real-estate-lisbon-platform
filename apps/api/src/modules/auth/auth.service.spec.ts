import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  AuthService,
} from './auth.service';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  ProfileScoreService,
} from '../users/profile-score.service';

import {
  EmailService,
} from '../email/email.service';

import {
  AuditService,
} from '../audit/audit.service';

describe(
  'AuthService',
  () => {
    let service:
      AuthService;

    const prismaMock = {};

    const jwtServiceMock = {
      sign:
        jest.fn(),

      signAsync:
        jest.fn(),

      verify:
        jest.fn(),

      verifyAsync:
        jest.fn(),
    };

    const profileScoreServiceMock = {
      updateUserScore:
        jest.fn(),
    };

    const emailServiceMock = {};

    const auditServiceMock = {};

    beforeEach(
      async () => {
        const module:
          TestingModule =
          await Test.createTestingModule({
            providers: [
              AuthService,

              {
                provide:
                  PrismaService,

                useValue:
                  prismaMock,
              },

              {
                provide:
                  JwtService,

                useValue:
                  jwtServiceMock,
              },

              {
                provide:
                  ProfileScoreService,

                useValue:
                  profileScoreServiceMock,
              },

              {
                provide:
                  EmailService,

                useValue:
                  emailServiceMock,
              },

              {
                provide:
                  AuditService,

                useValue:
                  auditServiceMock,
              },
            ],
          }).compile();

        service =
          module.get<AuthService>(
            AuthService,
          );
      },
    );

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