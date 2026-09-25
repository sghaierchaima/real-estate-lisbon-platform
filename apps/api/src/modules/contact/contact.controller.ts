import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  Role,
} from '@prisma/client';

import {
  ContactService,
} from './contact.service';

import {
  CreateContactMessageDto,
} from './dto/create-contact-message.dto';

// ADAPTE uniquement ces imports
// aux vrais chemins de ton projet.
import {
  JwtAuthGuard,
} from '../../common/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../../common/guards/roles.guard';

import {
  Roles,
} from '../../common/decorators/roles.decorator';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService:
      ContactService,
  ) {}

  /*
   * PUBLIC
   */

  @Post()
  create(
    @Body()
    dto: CreateContactMessageDto,
  ) {
    return this.contactService.create(dto);
  }

  /*
   * ADMIN
   */

  @Get('admin')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findAll() {
    return this.contactService.findAll();
  }

  @Get('admin/:id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.contactService.findOne(id);
  }

  @Patch('admin/:id/read')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  markAsRead(
    @Param('id')
    id: string,
  ) {
    return this.contactService.markAsRead(id);
  }

  @Patch('admin/:id/unread')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  markAsUnread(
    @Param('id')
    id: string,
  ) {
    return this.contactService.markAsUnread(id);
  }

  @Delete('admin/:id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  remove(
    @Param('id')
    id: string,
  ) {
    return this.contactService.remove(id);
  }
}