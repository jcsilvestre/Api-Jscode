import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGroupsAudit } from './user-groups-audit.entity';
import { CreateUserGroupsAuditDto } from './dto/create-user-groups-audit.dto';
import { UpdateUserGroupsAuditDto } from './dto/update-user-groups-audit.dto';

@Injectable()
export class UserGroupsAuditService {
  constructor(
    @InjectRepository(UserGroupsAudit)
    private userGroupsAuditRepository: Repository<UserGroupsAudit>,
  ) {}

  async create(createUserGroupsAuditDto: CreateUserGroupsAuditDto): Promise<UserGroupsAudit> {
    // Map DTO fields to entity fields
    const auditData = {
      user_id: createUserGroupsAuditDto.userId,
      group_id: createUserGroupsAuditDto.groupId,
      action: createUserGroupsAuditDto.action,
      performed_by: createUserGroupsAuditDto.performedBy
    };

    const audit = this.userGroupsAuditRepository.create(auditData);
    const savedAudit = await this.userGroupsAuditRepository.save(audit);
    
    // Return the saved audit without loading relations to avoid potential issues
    return savedAudit;
  }

  async findAll(): Promise<UserGroupsAudit[]> {
    return await this.userGroupsAuditRepository.find({
      order: { performed_at: 'DESC' }
    });
  }

  async findByUser(userId: string): Promise<UserGroupsAudit[]> {
    return await this.userGroupsAuditRepository.find({
      where: { user_id: userId },
      order: { performed_at: 'DESC' }
    });
  }

  async findByGroup(groupId: string): Promise<UserGroupsAudit[]> {
    return await this.userGroupsAuditRepository.find({
      where: { group_id: groupId },
      order: { performed_at: 'DESC' }
    });
  }

  async findByAction(action: string): Promise<UserGroupsAudit[]> {
    return await this.userGroupsAuditRepository.find({
      where: { action },
      relations: ['user', 'group', 'performedBy'],
      order: { performed_at: 'DESC' }
    });
  }

  async findByPerformer(performedBy: string): Promise<UserGroupsAudit[]> {
    return await this.userGroupsAuditRepository.find({
      where: { performed_by: performedBy },
      relations: ['user', 'group', 'performedBy'],
      order: { performed_at: 'DESC' }
    });
  }

  async findOne(id: string): Promise<UserGroupsAudit> {
    const audit = await this.userGroupsAuditRepository.findOne({
      where: { id }
    });

    if (!audit) {
      throw new NotFoundException(`Audit record with ID ${id} not found`);
    }

    return audit;
  }

  async update(id: string, updateUserGroupsAuditDto: UpdateUserGroupsAuditDto): Promise<UserGroupsAudit> {
    const audit = await this.findOne(id);

    // Map DTO fields to entity fields
    const updateData: any = {};
    if (updateUserGroupsAuditDto.userId) updateData.user_id = updateUserGroupsAuditDto.userId;
    if (updateUserGroupsAuditDto.groupId) updateData.group_id = updateUserGroupsAuditDto.groupId;
    if (updateUserGroupsAuditDto.action) updateData.action = updateUserGroupsAuditDto.action;
    if (updateUserGroupsAuditDto.performedBy) updateData.performed_by = updateUserGroupsAuditDto.performedBy;

    Object.assign(audit, updateData);
    return await this.userGroupsAuditRepository.save(audit);
  }

  async remove(id: string): Promise<void> {
    const audit = await this.findOne(id);
    await this.userGroupsAuditRepository.remove(audit);
  }

  async logUserGroupChange(
    userId: string,
    groupId: string,
    action: 'added' | 'removed',
    performedBy: string
  ): Promise<UserGroupsAudit> {
    const createDto: CreateUserGroupsAuditDto = {
      userId: userId,
      groupId: groupId,
      action,
      performedBy: performedBy
    };

    return await this.create(createDto);
  }

  async getAuditHistory(
    userId?: string,
    groupId?: string,
    action?: string,
    limit: number = 100
  ): Promise<UserGroupsAudit[]> {
    const query = this.userGroupsAuditRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .leftJoinAndSelect('audit.group', 'group')
      .leftJoinAndSelect('audit.performedBy', 'performedBy')
      .orderBy('audit.performed_at', 'DESC')
      .limit(limit);

    if (userId) {
      query.andWhere('audit.user_id = :userId', { userId });
    }

    if (groupId) {
      query.andWhere('audit.group_id = :groupId', { groupId });
    }

    if (action) {
      query.andWhere('audit.action = :action', { action });
    }

    return await query.getMany();
  }
}