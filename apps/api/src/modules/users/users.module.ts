import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProfileScoreService } from './profile-score.service';
@Module({
  controllers: [UsersController],
  providers: [UsersService, ProfileScoreService],
   exports: [UsersService, ProfileScoreService],
})
export class UsersModule {}