import { IsEmail, IsNotEmpty, IsString, Length, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 120)
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(1, 120)
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
  username?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
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