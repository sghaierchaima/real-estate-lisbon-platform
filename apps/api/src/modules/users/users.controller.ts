import {
  Controller,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { UsersService } from './users.service';
import {
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { validateImageFile } from '../../common/utils/file-upload.util';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('users.read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.usersService.findOne(req.user.id);
  }


  @Get('profile-progress')
  @UseGuards(JwtAuthGuard)
  getProfileProgress(@Req() req: AuthenticatedRequest) {
  return this.usersService.getProfileProgress(req.user.id);
}

 @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.delete')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.remove(id, req.user.id);
  }

  @Patch('me')
updateMe(@Req() req: AuthenticatedRequest, @Body() dto: any) {
  return this.usersService.updateMe(req.user.id, dto);
}
@Patch('me/avatar')
@UseInterceptors(
  FileInterceptor('avatar', {
    dest: './uploads/avatars',
  }),
)
uploadAvatar(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: AuthenticatedRequest,
) {
  validateImageFile(file);

  return this.usersService.updateAvatar(
    req.user.id,
    `/uploads/avatars/${file.filename}`,
  );
}

@UseGuards(JwtAuthGuard)
@Get('me/profile')
getMyProfile(@Req() req: AuthenticatedRequest) {
  return this.usersService.getMyProfile(req.user.id);
}



}