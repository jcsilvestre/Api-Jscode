import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyTokenDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  token: string;
}