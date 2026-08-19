import { Module } from '@nestjs/common';

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadScoringService } from './lead-scoring.service';
import { PropertyAlertsService } from './property-alerts.service';

import { UsersModule } from '../users/users.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    UsersModule,
    MatchingModule,
  ],

  controllers: [
    LeadsController,
  ],

  providers: [
    LeadsService,
    LeadScoringService,
    PropertyAlertsService,
  ],

  exports: [
    LeadScoringService,
    PropertyAlertsService,
  ],
})
export class LeadsModule {}