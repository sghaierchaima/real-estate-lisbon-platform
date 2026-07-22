import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body()
    dto: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    return this.authService.changePassword(req.user.id, dto);
  }

 @Throttle({
  default: {
    limit: 5,
    ttl: 60000,
  },
})
@Post('google')
googleLogin(
  @Body()
  body: {
    idToken: string;
  },
) {
  return this.authService.googleLogin(
    body.idToken,
  );
}


  @Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('forgot-password')
forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto.email);
}

@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('reset-password')
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto);
}
}