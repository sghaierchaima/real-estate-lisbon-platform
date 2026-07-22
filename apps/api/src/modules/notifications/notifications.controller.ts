import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

import { NotificationsService } from './notifications.service';

type NotificationFilter = 'all' | 'unread' | 'read';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('notifications.read')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('filter') filter: NotificationFilter = 'all',
  ) {
    return this.notificationsService.findAll(
      req.user,
      filter,
    );
  }

  @Get('unread-count')
  unreadCount(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.unreadCount(
      req.user,
    );
  }

  @Patch('read-all')
  markAllAsRead(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAllAsRead(
      req.user,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAsRead(
      id,
      req.user,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.remove(
      id,
      req.user,
    );
  }
}