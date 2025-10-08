import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(120)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  owner_user_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  max_users?: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  suspension_type?: string;

  @IsOptional()
  @IsString()
  suspended_reason?: string;
}