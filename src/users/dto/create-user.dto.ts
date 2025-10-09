import { IsEmail, IsNotEmpty, IsString, Length, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import xss from 'xss';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 120)
  @Transform(({ value }) => xss(value?.toString().trim()))
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(1, 120)
  @Transform(({ value }) => xss(value?.toString().trim().toLowerCase()))
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  passwordHash: string;

  @IsNotEmpty()
  @IsUUID()
  tenantId: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value ? xss(value.toString().trim()) : value)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  @Transform(({ value }) => value ? xss(value.toString().trim()) : value)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isTenantAdmin?: boolean;
}