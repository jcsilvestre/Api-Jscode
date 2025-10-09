import { IsEmail, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import xss from 'xss';

export class VerifyTokenDto {
  @IsEmail()
  @Transform(({ value }) => xss(value?.toString().trim().toLowerCase()))
  email: string;

  @IsString()
  @Length(9, 9)
  @Transform(({ value }) => xss(value?.toString().trim()))
  token: string;
}