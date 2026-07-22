import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import {
  generateSafeImageFilename,
  validateImageFile,
} from '../../common/utils/file-upload.util';

import { UpdateStoryStatusDto } from './dto/update-story-status.dto';
import { StoriesService } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
  ) {}

  /*
   * ============================================================
   * PUBLIC ROUTES
   * ============================================================
   */

  @Get('public')
  findApprovedPublic() {
    return this.storiesService.findApprovedPublic();
  }

  @Get('public/:id')
  findPublicOne(@Param('id') id: string) {
    return this.storiesService.findPublicOne(id);
  }

  /*
   * ============================================================
   * AUTHENTICATED ROUTES
   * ============================================================
   */

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stories.read')
  findAll(@Req() req: AuthenticatedRequest) {
    return this.storiesService.findAll(req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stories.create')
  @UseInterceptors(
    FilesInterceptor('images', 1, {
      storage: diskStorage({
        destination: './uploads/stories',
        filename: (_req, file, callback) => {
          callback(
            null,
            generateSafeImageFilename(
              file.originalname,
            ),
          );
        },
      }),
    }),
  )
  create(
    @UploadedFiles()
    files: Express.Multer.File[],
    @Body() body: any,
    @Req() req: AuthenticatedRequest,
  ) {
    files?.forEach(validateImageFile);

    const imageUrl = files?.[0]
      ? `/uploads/stories/${files[0].filename}`
      : undefined;

    return this.storiesService.create(
      {
        title: body.title,
        excerpt: body.excerpt,
        content: body.content,
        author: body.author,
        location: body.location,
        imageUrl,
      },
      req.user,
    );
  }

  /*
   * Les routes fixes doivent rester avant :id.
   */

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stories.approve')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStoryStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.storiesService.updateStatus(
      id,
      dto,
      req.user,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stories.delete')
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.storiesService.remove(
      id,
      req.user,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stories.read')
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.storiesService.findOne(
      id,
      req.user,
    );
  }
}