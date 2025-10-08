import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class RegisterMasterDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  // Dados do Tenant
  @IsString()
  @MaxLength(120)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  companySlug?: string;

  @IsOptional()
  @IsString()
  companyDescription?: string;
}