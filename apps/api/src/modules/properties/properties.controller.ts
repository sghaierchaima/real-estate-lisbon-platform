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
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { validateImageFile } from '../../common/utils/file-upload.util';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('properties.read')
  findAll(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.findAll(
      req.user,
    );
  }

  @Get('public')
  findPublic() {
    return this.propertiesService.findPublic();
  }

  @Get('public/:id')
  findPublicOne(
    @Param('id') id: string,
  ) {
    return this.propertiesService.findPublicOne(
      id,
    );
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('properties.read')
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.findOne(
      id,
      req.user,
    );
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('properties.create')
  @UseInterceptors(
  FilesInterceptor('images', 10, {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }),
)
  async create(
    @UploadedFiles()
    files: Express.Multer.File[],
    @Body() body: any,
    @Req() req: AuthenticatedRequest,
  ) {
    files?.forEach(validateImageFile);

const uploadedImages = await Promise.all(
  (files || []).map((file) =>
    this.cloudinaryService.uploadPropertyImage(file),
  ),
);

const imageUrls = uploadedImages.map(
  (image) => image.secure_url,
);

    return this.propertiesService.create(
      {
        title: body.title,
        description: body.description,
        location: body.location,
        region: body.region,
        city: body.city,
        price: Number(body.price),
        propertyType: body.propertyType,
        status: body.status,
        featured:
          body.featured === 'true',
        bedrooms: Number(body.bedrooms),
        bathrooms: Number(
          body.bathrooms,
        ),
        area: Number(body.area),
        landArea: Number(body.landArea),
        constructionYear: Number(
          body.constructionYear,
        ),
        equipments: body.equipments
          ? JSON.parse(body.equipments)
          : [],
        imageUrls,
      },
      req.user,
    );
  }

  @Patch(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('properties.update')
  @UseInterceptors(
  FilesInterceptor('images', 10, {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }),
)
  async update(
    @Param('id') id: string,
    @UploadedFiles()
    files: Express.Multer.File[],
    @Body() body: any,
    @Req() req: AuthenticatedRequest,
  ) {
    files?.forEach(validateImageFile);

const uploadedImages = await Promise.all(
  (files || []).map((file) =>
    this.cloudinaryService.uploadPropertyImage(file),
  ),
);

const newImageUrls = uploadedImages.map(
  (image) => image.secure_url,
);

    const existingImageUrls =
      body.existingImageUrls
        ? JSON.parse(
            body.existingImageUrls,
          )
        : [];

    return this.propertiesService.update(
      id,
      {
        title: body.title,
        description: body.description,
        location: body.location,
        region: body.region,
        city: body.city,
        price: Number(body.price),
        propertyType: body.propertyType,
        status: body.status,
        featured:
          body.featured === 'true',
        bedrooms: Number(body.bedrooms),
        bathrooms: Number(
          body.bathrooms,
        ),
        area: Number(body.area),
        landArea: Number(body.landArea),
        constructionYear: Number(
          body.constructionYear,
        ),
        equipments: body.equipments
          ? JSON.parse(body.equipments)
          : [],
        imageUrls: [
          ...existingImageUrls,
          ...newImageUrls,
        ],
      },
      req.user,
    );
  }

  @Delete(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('properties.delete')
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.remove(
      id,
      req.user,
    );
  }
}