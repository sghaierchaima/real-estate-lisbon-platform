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
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class MatchingController {
  constructor(
    private readonly matchingService:
      MatchingService,
  ) {}

  /*
   * ============================================================
   * ADMIN — MONITORING ONLY
   * ============================================================
   *
   * Admin can inspect all matches.
   *
   * No:
   * - Generate
   * - Approve
   * - Reject
   *
   * Automatic matching is managed by AutoMatchingService.
   * ============================================================
   */

  @Get()
  @Permissions('matching.read.all')
  findAll(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService.findAll(
      req.user,
    );
  }

  /*
   * ============================================================
   * BUYER ROUTES
   * ============================================================
   */

  @Get('me/buyer')
  @Permissions(
    'matching.read.own.buyer',
  )
  findMyBuyerMatches(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService.findByBuyer(
      req.user.id,
    );
  }

  /*
   * Buyer explicitly contacts a property.
   *
   * This creates an ACTIVE match immediately
   * with the Property Agent responsible for
   * that property.
   *
   * No Admin approval.
   */
  @Post(
    'contact-property/:propertyId',
  )
  @Permissions(
    'matching.contact.property',
  )
  contactProperty(
    @Param('propertyId')
    propertyId: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.matchingService.contactProperty(
      propertyId,
      req.user,
    );
  }

  /*
   * ============================================================
   * PROFESSIONAL ROUTES
   * ============================================================
   */

  @Get('me/professional')
  @Permissions(
    'matching.read.own.professional',
  )
  findMyProfessionalMatches(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.matchingService
      .findByProfessionalUser(
        req.user.id,
      );
  }

  /*
   * ACTIVE
   *   ↓
   * CONTACTED
   *
   * Only the assigned Professional.
   */
  @Patch(':id/contacted')
  @Permissions('matching.contact')
  markAsContacted(
    @Param('id')
    id: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.matchingService.markAsContacted(
      id,
      req.user,
    );
  }

  /*
   * CONTACTED
   *   ↓
   * COMPLETED
   *   ↓
   * associated Lead = CLOSED
   *
   * Only the assigned Professional.
   */
  @Patch(':id/completed')
  @Permissions('matching.complete')
  markAsCompleted(
    @Param('id')
    id: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.matchingService.markAsCompleted(
      id,
      req.user,
    );
  }
}