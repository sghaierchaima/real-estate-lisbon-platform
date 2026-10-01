import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import {
  extname,
} from 'path';

import { ProfessionalType, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { CreateProfessionalApplicationDto } from './dto/create-professional-application.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get('public')
  findPublic(@Query('type') type?: ProfessionalType) {
    return this.professionalsService.findPublicByType(type);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.professionalsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('pending')
  findPending() {
    return this.professionalsService.findPending();
  }

  @UseGuards(JwtAuthGuard)
@Get('me')
findMe(@Req() req: AuthenticatedRequest) {
  return this.professionalsService.findMe(req.user.id);
}

@UseGuards(JwtAuthGuard)
@Patch('me')
updateMe(@Req() req: AuthenticatedRequest, @Body() dto: any) {
  return this.professionalsService.updateMe(req.user.id, dto);
}

@UseGuards(JwtAuthGuard)
@Get('me/application')
getMyApplication(
  @Req() req: AuthenticatedRequest,
) {
  return this.professionalsService
    .getMyApplication(req.user.id);
}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.professionalsService.approve(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.professionalsService.reject(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateProfessionalDto) {
    return this.professionalsService.create(dto);
  }
  @Get('public/:id')
findPublicOne(@Param('id') id: string) {
  return this.professionalsService.findPublicOne(id);
}

@Throttle({
  default: {
    limit: 3,
    ttl: 60000,
  },
})
@UseGuards(JwtAuthGuard)
@Post('apply')
@UseInterceptors(
  FileInterceptor(
    'verificationDocument',
    {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (
        req,
        file,
        callback,
      ) => {
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
        ];

        if (
          !allowedMimeTypes.includes(
            file.mimetype,
          )
        ) {
          return callback(
            new BadRequestException(
              'Only PDF, JPG, JPEG and PNG files are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    },
  ),
)
apply(
  @Req()
  req: AuthenticatedRequest,

  @UploadedFile()
  verificationDocument:
    Express.Multer.File,

  @Body()
  dto:
    CreateProfessionalApplicationDto,
) {
  if (!verificationDocument) {
    throw new BadRequestException(
      'A professional verification document is required.',
    );
  }

  return this.professionalsService.apply(
    req.user.id,
    dto,
    verificationDocument,
  );
}}