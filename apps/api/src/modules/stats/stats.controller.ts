import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AuthenticatedRequest } from '../../common/types/authenticated-request';

import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('analytics.read')
  getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get('recent-activity')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('analytics.read')
  getRecentActivity() {
    return this.statsService.getRecentActivity();
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('analytics.read')
  getAnalyticsDashboard() {
    return this.statsService.getAnalyticsDashboard();
  }

  @Get('professional-dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSIONAL)
  getProfessionalDashboardStats(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.statsService.getProfessionalDashboardStats(
      req.user,
    );
  }

  @Get('buyer-dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  getBuyerDashboard(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.statsService.getBuyerDashboardStats(
      req.user,
    );
  }
}