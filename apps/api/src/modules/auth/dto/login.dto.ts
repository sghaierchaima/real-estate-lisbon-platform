import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1, {
    message: 'Password is required',
  })
  @MaxLength(72, {
    message: 'Password is too long',
  })
  password!: string;
}