import { Module } from '@nestjs/common';

import { SavedPropertiesController } from './saved-properties.controller';
import { SavedPropertiesService } from './saved-properties.service';

@Module({
  controllers: [
    SavedPropertiesController,
  ],

  providers: [
    SavedPropertiesService,
  ],

  exports: [
    SavedPropertiesService,
  ],
})
export class SavedPropertiesModule {}