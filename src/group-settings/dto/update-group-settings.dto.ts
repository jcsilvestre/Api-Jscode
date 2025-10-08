import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGroupSettingsDto } from './create-group-settings.dto';

export class UpdateGroupSettingsDto extends PartialType(
  OmitType(CreateGroupSettingsDto, ['groupId'] as const)
) {}