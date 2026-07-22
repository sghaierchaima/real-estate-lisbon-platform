import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
apply(
  @Req()
  req: AuthenticatedRequest,

  @Body()
  dto: CreateProfessionalApplicationDto,
) {
  return this.professionalsService.apply(
    req.user.id,
    dto,
  );
}


}