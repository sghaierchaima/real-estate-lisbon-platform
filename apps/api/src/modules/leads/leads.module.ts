import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadScoringService } from './lead-scoring.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadScoringService],
  exports: [LeadScoringService],
})
export class LeadsModule {}