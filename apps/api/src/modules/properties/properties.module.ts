import { Module } from '@nestjs/common';

import { PropertiesController } from './properties.controller';

import { PropertiesService } from './properties.service';

import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';

import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [
    CloudinaryModule,
    LeadsModule,
  ],

  controllers: [
    PropertiesController,
  ],

  providers: [
    PropertiesService,
  ],
})
export class PropertiesModule {}