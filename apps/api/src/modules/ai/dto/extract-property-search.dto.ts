import { IsString } from 'class-validator';

export class ExtractPropertySearchDto {
  @IsString()
  searchText!: string;
}