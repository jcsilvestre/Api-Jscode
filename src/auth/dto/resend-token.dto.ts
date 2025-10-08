import { IsEmail } from 'class-validator';

export class ResendTokenDto {
  @IsEmail()
  email: string;
}