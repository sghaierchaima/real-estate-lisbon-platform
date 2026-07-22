import { StoryStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateStoryStatusDto {
  @IsIn(
    [StoryStatus.APPROVED, StoryStatus.REJECTED],
    {
      message: 'Status must be APPROVED or REJECTED',
    },
  )
  status!: StoryStatus;
}