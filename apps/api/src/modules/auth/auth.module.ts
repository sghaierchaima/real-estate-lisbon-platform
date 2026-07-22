import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';
@Module({
  imports: [
    UsersModule,
    EmailModule,
    AuditModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'real_estate_lisbon_super_secret_key',
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}