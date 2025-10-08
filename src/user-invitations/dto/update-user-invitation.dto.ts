import { PartialType } from '@nestjs/mapped-types';
import { CreateUserInvitationDto } from './create-user-invitation.dto';

export class UpdateUserInvitationDto extends PartialType(CreateUserInvitationDto) {}