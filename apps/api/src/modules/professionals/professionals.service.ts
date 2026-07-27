import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ProfessionalType,
  Role,
  VerificationStatus,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { CreateProfessionalApplicationDto } from './dto/create-professional-application.dto';


@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(
  private readonly prisma: PrismaService,
  private readonly notificationsService: NotificationsService,
  private readonly emailService: EmailService,
) {}

  findAll() {
    return this.prisma.professionalProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  findPending() {
    return this.prisma.professionalProfile.findMany({
      where: {
        verificationStatus: VerificationStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
  const professional =
    await this.prisma.professionalProfile.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            avatarUrl: true,
            phone: true,
            country: true,
            city: true,
          },
        },

        properties: {
          where: {
            status: "PUBLISHED",
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 6,
        },
      },
    });

  if (!professional) {
    throw new NotFoundException(
      "Professional not found",
    );
  }

  return professional;
}

  async approve(id: string) {
    const professional =
      await this.prisma.professionalProfile.findUnique({
        where: {
          id,
        },
        include: {
          user: true,
        },
      });

    if (!professional) {
      throw new NotFoundException(
        'Professional application not found',
      );
    }

    if (
      professional.verificationStatus ===
      VerificationStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'This professional application is already approved',
      );
    }

    if (
      professional.verificationStatus !==
      VerificationStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending professional applications can be approved',
      );
    }

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          await tx.user.update({
            where: {
              id: professional.userId,
            },
            data: {
              role: Role.PROFESSIONAL,
            },
          });

          return tx.professionalProfile.update({
            where: {
              id: professional.id,
            },
            data: {
              verificationStatus:
                VerificationStatus.ACTIVE,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  role: true,
                  avatarUrl: true,
                  phone: true,
                  country: true,
                  city: true,
                },
              },
              properties: {
                where: {
                  status: 'PUBLISHED',
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 6,
              },
            },
          });
        },
      );

    /*
     * La notification est conservée et attendue :
     * elle est enregistrée avant la réponse HTTP.
     */
    await this.notificationsService.create({
      userId: professional.userId,
      title: 'Professional Profile Approved',
      message:
        'Your professional profile has been approved. Sign in again to access your professional workspace.',
      type: NotificationType.SYSTEM,
    });

    /*
     * L'e-mail est lancé sans bloquer la réponse HTTP.
     * Une erreur d'envoi est enregistrée dans les logs
     * sans annuler l'approbation déjà effectuée.
     */
    void this.sendApprovalEmail({
      email: professional.user.email,
      fullName: professional.user.fullName,
    });

    return updated;
  }

  private async sendApprovalEmail(data: {
    email: string;
    fullName: string | null;
  }): Promise<void> {
    try {
      await this.emailService.sendMail({
        to: data.email,
        subject:
          'Your professional profile has been approved',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0F2340">
            <h2>Professional profile approved</h2>

            <p>
              Hello ${data.fullName || 'Professional'},
            </p>

            <p>
              Your professional profile has been approved
              and is now active.
            </p>

            <p>
              Please sign out and sign in again to access
              your professional workspace.
            </p>

            <p>
              You can now receive buyer matches and manage
              your professional activity.
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Unable to send approval email to ${data.email}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  async reject(id: string) {
    const professional =
      await this.prisma.professionalProfile.findUnique({
        where: {
          id,
        },
        include: {
          user: true,
        },
      });

    if (!professional) {
      throw new NotFoundException(
        'Professional application not found',
      );
    }

    if (
      professional.verificationStatus ===
      VerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'This professional application is already rejected',
      );
    }

    if (
      professional.verificationStatus !==
      VerificationStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending professional applications can be rejected',
      );
    }

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          await tx.user.update({
            where: {
              id: professional.userId,
            },
            data: {
              role: Role.BUYER,
            },
          });

          return tx.professionalProfile.update({
            where: {
              id: professional.id,
            },
            data: {
              verificationStatus:
                VerificationStatus.REJECTED,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  role: true,
                  avatarUrl: true,
                  phone: true,
                  country: true,
                  city: true,
                },
              },
              properties: {
                where: {
                  status: 'PUBLISHED',
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 6,
              },
            },
          });
        },
      );

    await this.notificationsService.create({
      userId: professional.userId,
      title: 'Professional Profile Rejected',
      message:
        'Your professional application has been rejected. Please contact support for more information.',
      type: NotificationType.SYSTEM,
    });

    void this.sendRejectionEmail({
      email: professional.user.email,
      fullName: professional.user.fullName,
    });

    return updated;
  }

  private async sendRejectionEmail(data: {
    email: string;
    fullName: string | null;
  }): Promise<void> {
    try {
      await this.emailService.sendMail({
        to: data.email,
        subject:
          'Your professional application has been rejected',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0F2340">
            <h2>Professional application rejected</h2>

            <p>
              Hello ${data.fullName || 'Professional'},
            </p>

            <p>
              Your professional application was not approved.
            </p>

            <p>
              Please contact the platform administration
              if you need more information.
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Unable to send rejection email to ${data.email}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  async create(dto: CreateProfessionalDto) {
  const user = await this.prisma.user.findUnique({
    where: { id: dto.userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.role !== Role.PROFESSIONAL) {
    throw new BadRequestException('User must have PROFESSIONAL role');
  }

  const existingProfile = await this.prisma.professionalProfile.findUnique({
    where: { userId: dto.userId },
  });

  if (existingProfile) {
    throw new BadRequestException('Professional profile already exists');
  }

  return this.prisma.professionalProfile.create({
    data: {
      userId: dto.userId,
      professionalType: dto.professionalType,
      companyName: dto.companyName,
      bio: dto.bio,
      languages: dto.languages || [],
      rating: dto.rating || 0,
      reviewsCount: dto.reviewsCount || 0,
      clientsCount: dto.clientsCount || 0,
      verificationStatus: dto.verificationStatus || VerificationStatus.PENDING,
      isFeatured: dto.isFeatured || false,
      profileCompletion: dto.profileCompletion || 0,
    },
  });
}

async findPublicByType(type?: ProfessionalType) {
  return this.prisma.professionalProfile.findMany({
    where: {
      verificationStatus: VerificationStatus.ACTIVE,
      ...(type ? { professionalType: type } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });

}
async findPublicOne(id: string) {
  const professional = await this.prisma.professionalProfile.findFirst({
    where: {
      id,
      verificationStatus: VerificationStatus.ACTIVE,
    },
   include: {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      role: true,
      phone: true,
      country: true,
      city: true,
    },
  },
  properties: {
    where: {
      status: "PUBLISHED",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  },
},
      
    
  });

  if (!professional) {
    throw new NotFoundException('Professional not found');
  }

  return professional;
}
async findMe(userId: string) {
  const professional = await this.prisma.professionalProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
          phone: true,
          country: true,
          city: true,
        },
      },
    },
  });

  if (!professional) {
    throw new NotFoundException('Professional profile not found');
  }

  return professional;
}

async updateMe(
  userId: string,
  dto: {
    companyName?: string;
    professionalType?: ProfessionalType;
    bio?: string;
    languages?: string[];
  },
) {
  const professional = await this.prisma.professionalProfile.findUnique({
    where: { userId },
  });

  if (!professional) {
  return this.prisma.professionalProfile.create({
    data: {
      userId,
      professionalType: dto.professionalType || ProfessionalType.PROPERTY_AGENT,
      companyName: dto.companyName,
      bio: dto.bio,
      languages: dto.languages || [],
      rating: 0,
      reviewsCount: 0,
      clientsCount: 0,
      verificationStatus: VerificationStatus.PENDING,
      isFeatured: false,
      profileCompletion: this.calculateProfileCompletion({
        companyName: dto.companyName,
        professionalType: dto.professionalType || ProfessionalType.PROPERTY_AGENT,
        bio: dto.bio,
        languages: dto.languages || [],
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
          phone: true,
          country: true,
          city: true,
        },
      },
    },
  });
}

  return this.prisma.professionalProfile.update({
    where: { userId },
    data: {
      companyName: dto.companyName,
      professionalType: dto.professionalType,
      bio: dto.bio,
      languages: dto.languages || [],
      profileCompletion: this.calculateProfileCompletion({
        companyName: dto.companyName,
        professionalType: dto.professionalType,
        bio: dto.bio,
        languages: dto.languages || [],
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
          phone: true,
          country: true,
          city: true,
        },
      },
    },
  });
}

private calculateProfileCompletion(data: {
  companyName?: string | null;
  professionalType?: ProfessionalType;
  bio?: string | null;
  languages?: string[];
}) {
  let score = 0;

  if (data.companyName) score += 25;
  if (data.professionalType) score += 25;
  if (data.bio) score += 30;
  if (data.languages && data.languages.length > 0) score += 20;

  return score;
}

async apply(
  userId: string,
  dto: CreateProfessionalApplicationDto,
) {
  const user =
    await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        professionalProfile: true,
      },
    });

  if (!user) {
    throw new NotFoundException(
      'User not found',
    );
  }

  if (user.role === Role.ADMIN) {
    throw new BadRequestException(
      'Administrator accounts cannot submit a professional application',
    );
  }

  if (
    user.role === Role.PROFESSIONAL &&
    user.professionalProfile
      ?.verificationStatus ===
      VerificationStatus.ACTIVE
  ) {
    throw new BadRequestException(
      'This account is already an active professional',
    );
  }

  if (user.professionalProfile) {
    const status =
      user.professionalProfile
        .verificationStatus;

    if (
      status ===
      VerificationStatus.PENDING
    ) {
      throw new BadRequestException(
        'Your professional application is already under review',
      );
    }

    if (
      status ===
      VerificationStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'This account is already an active professional',
      );
    }

    if (
      status ===
      VerificationStatus.SUSPENDED
    ) {
      throw new BadRequestException(
        'Your professional account is suspended',
      );
    }

    if (
      status ===
      VerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Your previous professional application was rejected',
      );
    }
  }

  const normalizedLanguages = [
    ...new Set(
      dto.languages
        .map((language) =>
          language.trim(),
        )
        .filter(
          (language) =>
            language.length > 0,
        ),
    ),
  ];

  if (normalizedLanguages.length === 0) {
    throw new BadRequestException(
      'At least one language is required',
    );
  }

  const professionalProfile =
    await this.prisma
      .professionalProfile.create({
        data: {
          userId: user.id,

          professionalType:
            dto.professionalType,

          companyName:
            dto.companyName?.trim() ||
            null,

          bio:
            dto.bio?.trim() ||
            null,

          languages:
            normalizedLanguages,

          verificationStatus:
            VerificationStatus.PENDING,

          rating: 0,
          reviewsCount: 0,
          clientsCount: 0,
          isFeatured: false,

          profileCompletion:
            this.calculateApplicationCompletion(
              dto,
            ),
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });

  return {
    message:
      'Professional application submitted successfully',

    professionalProfile,
  };
}

async getMyApplication(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      avatarUrl: true,
      professionalProfile: {
        select: {
          id: true,
          userId: true,
          professionalType: true,
          companyName: true,
          bio: true,
          languages: true,
          rating: true,
          reviewsCount: true,
          clientsCount: true,
          verificationStatus: true,
          isFeatured: true,
          profileCompletion: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException(
      'User not found',
    );
  }

  return {
    role: user.role,
    professionalProfile:
      user.professionalProfile,
  };
}

private calculateApplicationCompletion(
  dto: CreateProfessionalApplicationDto,
) {
  let score = 40;

  if (dto.companyName?.trim()) {
    score += 20;
  }

  if (dto.bio?.trim()) {
    score += 20;
  }

  if (
    dto.languages.some(
      (language) =>
        language.trim().length > 0,
    )
  ) {
    score += 20;
  }

  return Math.min(score, 100);
}
}