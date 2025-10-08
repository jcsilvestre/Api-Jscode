import { IsUUID, IsString, IsOptional, IsDateString, IsIP, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateUserSessionDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsDateString()
  loginAt?: string;

  @IsOptional()
  @IsDateString()
  logoutAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}