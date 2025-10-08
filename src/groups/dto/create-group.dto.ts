import { IsString, IsOptional, IsUUID, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsUUID()
  tenantId: string;

  @IsOptional()
  @IsUUID()
  parentGroupId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}