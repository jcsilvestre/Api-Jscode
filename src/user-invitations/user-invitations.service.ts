import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserInvitation } from './user-invitation.entity';
import { CreateUserInvitationDto } from './dto/create-user-invitation.dto';
import { UpdateUserInvitationDto } from './dto/update-user-invitation.dto';
import * as crypto from 'crypto';

@Injectable()
export class UserInvitationsService {
  constructor(
    @InjectRepository(UserInvitation)
    private userInvitationsRepository: Repository<UserInvitation>,
  ) {}

  async create(createUserInvitationDto: CreateUserInvitationDto): Promise<UserInvitation> {
    // Check if invitation already exists for this email and tenant
    const existingInvitation = await this.userInvitationsRepository.findOne({
      where: { 
        email: createUserInvitationDto.email,
        tenant_id: createUserInvitationDto.tenantId,
        accepted_at: IsNull()
      }
    });

    if (existingInvitation) {
      throw new ConflictException('Pending invitation already exists for this email');
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Map DTO fields to entity fields
    const invitationData = {
      tenant_id: createUserInvitationDto.tenantId,
      email: createUserInvitationDto.email,
      invited_by: createUserInvitationDto.invitedBy,
      token: token,
      expires_at: new Date(createUserInvitationDto.expiresAt)
    };

    const invitation = this.userInvitationsRepository.create(invitationData);
    return await this.userInvitationsRepository.save(invitation);
  }

  async findAll(): Promise<UserInvitation[]> {
    return await this.userInvitationsRepository.find();
  }

  async findByTenant(tenantId: string): Promise<UserInvitation[]> {
    return await this.userInvitationsRepository.find({
      where: { tenant_id: tenantId }
    });
  }

  async findPending(tenantId?: string): Promise<UserInvitation[]> {
    const where: any = { accepted_at: IsNull() };
    if (tenantId) {
      where.tenant_id = tenantId;
    }

    return await this.userInvitationsRepository.find({
      where
    });
  }

  async findOne(id: string): Promise<UserInvitation> {
    const invitation = await this.userInvitationsRepository.findOne({
      where: { id }
    });

    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${id} not found`);
    }

    return invitation;
  }

  async findByToken(token: string): Promise<UserInvitation> {
    const invitation = await this.userInvitationsRepository.findOne({
      where: { token }
    });

    if (!invitation) {
      throw new NotFoundException(`Invitation with token not found`);
    }

    return invitation;
  }

  async update(id: string, updateUserInvitationDto: UpdateUserInvitationDto): Promise<UserInvitation> {
    const invitation = await this.findOne(id);

    Object.assign(invitation, updateUserInvitationDto);
    return await this.userInvitationsRepository.save(invitation);
  }

  async remove(id: string): Promise<void> {
    const invitation = await this.findOne(id);
    await this.userInvitationsRepository.remove(invitation);
  }

  async acceptInvitation(token: string): Promise<UserInvitation> {
    const invitation = await this.findByToken(token);

    if (invitation.accepted_at) {
      throw new ConflictException('Invitation has already been accepted');
    }

    if (new Date() > invitation.expires_at) {
      throw new ConflictException('Invitation has expired');
    }

    invitation.accepted_at = new Date();
    return await this.userInvitationsRepository.save(invitation);
  }

  async resendInvitation(id: string, newExpiresAt: Date): Promise<UserInvitation> {
    const invitation = await this.findOne(id);

    if (invitation.accepted_at) {
      throw new ConflictException('Cannot resend an accepted invitation');
    }

    // Generate new token and expiration
    invitation.token = crypto.randomBytes(32).toString('hex');
    invitation.expires_at = newExpiresAt;

    return await this.userInvitationsRepository.save(invitation);
  }

  async sendInvitation(
    email: string,
    tenantId: string,
    invitedBy: string,
  ): Promise<UserInvitation> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const createDto: CreateUserInvitationDto = {
      email,
      tenantId: tenantId,
      invitedBy: invitedBy,
      expiresAt: expiresAt.toISOString()
    };

    return await this.create(createDto);
  }
}