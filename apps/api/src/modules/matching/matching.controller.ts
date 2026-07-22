import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /*
   * ============================================================
   * ADMIN ROUTES
   * ============================================================
   */

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matching.read.all')
  findAll(@Req() req: AuthenticatedRequest) {
    return this.matchingService.findAll(req.user);
  }

  @Post('generate/:leadId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matching.generate')
  generate(
    @Param('leadId') leadId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService.generateForLead(leadId, req.user);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matching.approve')
  approve(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService.approve(id, req.user);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matching.reject')
  reject(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService.reject(id, req.user);
  }

  /*
   * ============================================================
   * BUYER ROUTES
   * ============================================================
   */

  @Get('me/buyer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matching.read.own.buyer')
  findMyBuyerMatches(@Req() req: AuthenticatedRequest) {
    return this.matchingService.findByBuyer(req.user.id);
  }

  /*
   * ============================================================
   * PROFESSIONAL ROUTES
   * ============================================================
   */

  @Get('me/professional')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matching.read.own.professional')
  findMyProfessionalMatches(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService.findByProfessionalUser(req.user.id);
  }

  @Patch(':id/contacted')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matching.contact')
  markAsContacted(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService.markAsContacted(id, req.user);
  }

  @Patch(':id/completed')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('matching.complete')
  markAsCompleted(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService.markAsCompleted(id, req.user);
  }
}