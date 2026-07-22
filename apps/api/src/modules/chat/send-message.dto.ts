import { IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  chatRoomId!: string;

  @IsString()
  content!: string;
}