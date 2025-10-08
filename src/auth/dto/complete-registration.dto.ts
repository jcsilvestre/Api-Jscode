import { IsString, IsNotEmpty, IsEmail, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CompleteRegistrationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsString()
  @IsNotEmpty()
  tenantSlug: string;

  @IsString()
  @IsOptional()
  tenantDescription?: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  maxUsers: number;
}