import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  leadNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  matchNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  propertyAlertNotifications?: boolean;
}