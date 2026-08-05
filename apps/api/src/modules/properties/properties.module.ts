import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [PropertiesController],
  providers: [PropertiesService]
})
export class PropertiesModule {}
