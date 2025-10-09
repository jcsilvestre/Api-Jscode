import { IsString, IsNotEmpty, IsEmail, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import xss from 'xss';

export class CompleteRegistrationDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => xss(value?.toString().trim().toLowerCase()))
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => xss(value?.toString().trim()))
  tenantName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => xss(value?.toString().trim().toLowerCase()))
  tenantSlug: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value ? xss(value.toString().trim()) : value)
  tenantDescription?: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  maxUsers: number;
}