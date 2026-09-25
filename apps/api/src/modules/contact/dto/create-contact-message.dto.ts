import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const CONTACT_SUBJECTS = [
  'General enquiry',
  'Buyer support',
  'Professional support',
  'Property or matching question',
  'Account support',
  'Technical issue',
  'Privacy question',
] as const;

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsIn(CONTACT_SUBJECTS)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;
}