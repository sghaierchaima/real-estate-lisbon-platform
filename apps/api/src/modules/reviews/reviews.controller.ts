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

import {
  ReviewStatus,
} from '@prisma/client';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService:
      ReviewsService,
  ) {}

  /*
   * ============================================================
   * BUYER ROUTES
   * ============================================================
   */

  @Post()
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('reviews.create')
  create(
    @Body()
    dto: CreateReviewDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.reviewsService.create(
      dto,
      req.user,
    );
  }

  @Get('match/:matchId/me')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('reviews.read.own')
  findMyReview(
    @Param('matchId')
    matchId: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.reviewsService.findMyReview(
      matchId,
      req.user,
    );
  }

  /*
   * ============================================================
   * ADMIN ROUTES
   * ============================================================
   */

  @Get()
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('reviews.read.all')
  findAll(
    @Req()
    req: AuthenticatedRequest,

    @Query('status')
    status?: ReviewStatus,
  ) {
    return this.reviewsService.findAll(
      req.user,
      status,
    );
  }

  @Patch(':id/approve')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('reviews.approve')
  approve(
    @Param('id')
    id: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.reviewsService.approve(
      id,
      req.user,
    );
  }

  @Patch(':id/reject')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('reviews.reject')
  reject(
    @Param('id')
    id: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.reviewsService.reject(
      id,
      req.user,
    );
  }

  /*
   * ============================================================
   * PUBLIC ROUTES
   * ============================================================
   */

  @Get('professional/:professionalId')
  findByProfessional(
    @Param('professionalId')
    professionalId: string,
  ) {
    return this.reviewsService.findByProfessional(
      professionalId,
    );
  }
}