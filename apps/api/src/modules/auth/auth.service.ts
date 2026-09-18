import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import { ProfileScoreService } from '../users/profile-score.service';
import * as crypto from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly profileScoreService: ProfileScoreService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
  const normalizedEmail = dto.email
    .trim()
    .toLowerCase();

  const existingUser =
    await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  if (existingUser) {
    throw new BadRequestException(
      'Email already exists',
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      dto.password,
      10,
    );

  const user =
    await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName:
          dto.fullName?.trim() || null,
        role: Role.BUYER,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

  await this.profileScoreService
    .updateUserScore(user.id);

  const accessToken =
    this.generateToken(
      user.id,
      user.email,
      user.role,
    );

  return {
    message:
      'Account created successfully',
    user,
    accessToken,
  };
}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    };
  }

  async googleLogin(idToken: string) {
  if (!idToken) {
    throw new UnauthorizedException(
      'Google token is required',
    );
  }

  let payload;

  try {
    const ticket =
      await this.googleClient.verifyIdToken({
        idToken,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });

    payload = ticket.getPayload();
  } catch {
    throw new UnauthorizedException(
      'Invalid or expired Google token',
    );
  }

  if (!payload?.email) {
    throw new UnauthorizedException(
      'Invalid Google account',
    );
  }

  if (!payload.email_verified) {
    throw new UnauthorizedException(
      'Your Google email address is not verified',
    );
  }

  const email =
    payload.email.trim().toLowerCase();

  let user =
    await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

  const isNewUser = !user;

  if (!user) {
    user = await this.prisma.user.create({
      data: {
        email,
        fullName:
          payload.name?.trim() || null,
        avatarUrl:
          payload.picture || null,

        // Un compte public Google est
        // toujours créé comme BUYER.
        role: Role.BUYER,
      },
    });

    await this.profileScoreService
      .updateUserScore(user.id);
 } else {
  user = await this.prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      // Ne pas écraser les informations personnalisées
      // déjà enregistrées par l'utilisateur.
      fullName:
        user.fullName ||
        payload.name?.trim() ||
        null,

      // IMPORTANT :
      // l'avatar personnalisé enregistré dans la DB
      // est prioritaire sur l'avatar Google.
      avatarUrl:
        user.avatarUrl ||
        payload.picture ||
        null,
    },
  });
}

  const accessToken =
    this.generateToken(
      user.id,
      user.email,
      user.role,
    );

  await this.auditService.log({
    userId: user.id,
    userRole: user.role,
    action: isNewUser
      ? 'GOOGLE_ACCOUNT_CREATED'
      : 'GOOGLE_LOGIN_SUCCESS',
    entity: 'User',
    entityId: user.id,
    description: isNewUser
      ? `Google account created for ${user.email}`
      : `Google login completed for ${user.email}`,
  });

  return {
    message: isNewUser
      ? 'Google account created successfully'
      : 'Google login successful',

    isNewUser,

    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },

    accessToken,
  };
}

  async changePassword(
    userId: string,
    dto: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException(
        'Current password and new password are required',
      );
    }

    if (dto.newPassword.length < 8) {
      throw new BadRequestException(
        'New password must contain at least 8 characters',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }
  async forgotPassword(email: string) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const user =
    await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  /*
   * Sécurité :
   * on ne révèle jamais si l'adresse existe
   * ou non dans la base de données.
   */
  if (!user) {
    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  /*
   * Si password est null, cela signifie
   * généralement que le compte a été créé
   * avec Google.
   */
  const isSettingPassword =
    !user.password;

  /*
   * On supprime les anciens tokens encore
   * inutilisés pour que seul le dernier lien
   * envoyé reste valide.
   */
  await this.prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  const rawToken =
    crypto.randomBytes(32).toString('hex');

  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const expiresAt = new Date(
    Date.now() + 15 * 60 * 1000,
  );

  await this.prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl =
    `${process.env.FRONTEND_URL}` +
    `/reset-password?token=${rawToken}`;

  await this.emailService.sendMail({
    to: user.email,

    subject: isSettingPassword
      ? 'Set your password'
      : 'Reset your password',

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #0F2340;
        "
      >
        <h2>
          ${
            isSettingPassword
              ? 'Set your password'
              : 'Password reset request'
          }
        </h2>

        <p>
          Hello ${
            user.fullName ||
            'there'
          },
        </p>

        <p>
          ${
            isSettingPassword
              ? 'Your account currently uses Google Sign-In. Use the link below to create a password for email login.'
              : 'You requested to reset your password.'
          }
        </p>

        <p>
          This link will expire in 15 minutes.
        </p>

        <p>
          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #1B365D;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            "
          >
            ${
              isSettingPassword
                ? 'Set Password'
                : 'Reset Password'
            }
          </a>
        </p>

        <p>
          If you did not request this action,
          you can safely ignore this email.
        </p>
      </div>
    `,
  });

  await this.auditService.log({
    userId: user.id,
    userRole: user.role,

    action: isSettingPassword
      ? 'PASSWORD_SETUP_REQUESTED'
      : 'PASSWORD_RESET_REQUESTED',

    entity: 'User',
    entityId: user.id,

    description: isSettingPassword
      ? `Password setup requested for ${user.email}`
      : `Password reset requested for ${user.email}`,
  });

  return {
    message:
      'If an account exists with this email, a password reset link has been sent.',
  };
}

async resetPassword(dto: ResetPasswordDto) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(dto.token)
    .digest('hex');

  const resetToken = await this.prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: true,
    },
  });

  if (!resetToken) {
    throw new BadRequestException('Invalid or expired reset token');
  }

  if (resetToken.usedAt) {
    throw new BadRequestException('This reset token has already been used');
  }

  if (resetToken.expiresAt < new Date()) {
    throw new BadRequestException('Reset token has expired');
  }

  const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

  await this.prisma.user.update({
    where: { id: resetToken.userId },
    data: {
      password: hashedPassword,
    },
  });

  await this.prisma.passwordResetToken.deleteMany({
  where: {
    userId: resetToken.userId,
    id: {
      not: resetToken.id,
    },
    usedAt: null,
  },
});

  await this.prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: {
      usedAt: new Date(),
    },
  });

  await this.auditService.log({
    userId: resetToken.userId,
    userRole: resetToken.user.role,
    action: 'PASSWORD_RESET_COMPLETED',
    entity: 'User',
    entityId: resetToken.userId,
    description: `Password reset completed for ${resetToken.user.email}`,
  });

  return {
    message: 'Password reset successfully',
  };
}

  private generateToken(userId: string, email: string, role: Role) {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }
}