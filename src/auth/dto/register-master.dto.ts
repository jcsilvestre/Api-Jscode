import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import xss from 'xss';

export class RegisterMasterDto {
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => xss(value?.toString().trim()))
  name: string;

  @IsEmail()
  @Transform(({ value }) => xss(value?.toString().trim().toLowerCase()))
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  // Dados do Tenant
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => xss(value?.toString().trim()))
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => value ? xss(value.toString().trim().toLowerCase()) : value)
  companySlug?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? xss(value.toString().trim()) : value)
  companyDescription?: string;
}