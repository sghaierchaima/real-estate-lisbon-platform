import {
  Controller,
  Delete,
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

import { SavedPropertiesService } from './saved-properties.service';

@Controller('saved-properties')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class SavedPropertiesController {
  constructor(
    private readonly savedPropertiesService:
      SavedPropertiesService,
  ) {}

  @Get()
  @Permissions('saved-properties.read')
  findAll(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.savedPropertiesService.findAll(
      req.user,
    );
  }

  @Get('ids')
  @Permissions('saved-properties.read')
  getSavedIds(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.savedPropertiesService.getSavedIds(
      req.user,
    );
  }
  @Get('count')
@Permissions('saved-properties.read')
count(
  @Req() req: AuthenticatedRequest,
) {
  return this.savedPropertiesService.count(
    req.user,
  );
} 

  @Get(':propertyId/status')
  @Permissions('saved-properties.read')
  isSaved(
    @Param('propertyId')
    propertyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.savedPropertiesService.isSaved(
      propertyId,
      req.user,
    );
  }

  @Post(':propertyId')
  @Permissions('saved-properties.create')
  save(
    @Param('propertyId')
    propertyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.savedPropertiesService.save(
      propertyId,
      req.user,
    );
  }

  @Patch(':propertyId/toggle')
  @Permissions(
    'saved-properties.create',
  )
  toggle(
    @Param('propertyId')
    propertyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.savedPropertiesService.toggle(
      propertyId,
      req.user,
    );
  }

  @Delete(':propertyId')
  @Permissions('saved-properties.delete')
  remove(
    @Param('propertyId')
    propertyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.savedPropertiesService.remove(
      propertyId,
      req.user,
    );
  }
}