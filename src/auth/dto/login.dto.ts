import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import xss from 'xss';

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => xss(value?.toString().trim().toLowerCase()))
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}