import { IsString, IsOptional, IsBoolean, IsUUID, MaxLength, Matches, IsObject, IsNotEmpty } from 'class-validator';

export class CreateGroupSettingsDto {
  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color code' })
  color?: string = '#3B82F6';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsOptional()
  @IsObject()
  settings?: any = {};
}