import { IsString } from "class-validator";

export class CreatePriceCheckerDto {
  @IsString()
  location!: string;

  @IsString()
 askingPrice!: string;

  @IsString()
 marketPrice!: string;

  @IsString()
 size!: string;

  @IsString()
 verdict!: string;

  @IsString()
 variancePct!: string;
}