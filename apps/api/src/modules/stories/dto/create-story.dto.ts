import { IsOptional, IsString } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  title!: string;
  
  @IsOptional()
  @IsString()
  imageUrl?: string;
  
  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  location?: string;
}