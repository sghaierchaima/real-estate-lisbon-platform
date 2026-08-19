import { IsBoolean } from 'class-validator';

export class UpdatePropertyAlertsDto {
  @IsBoolean()
  enabled!: boolean;
}