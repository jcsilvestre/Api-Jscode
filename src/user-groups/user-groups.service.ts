import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGroup } from './user-group.entity';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';

@Injectable()
export class UserGroupsService {
  constructor(
    @InjectRepository(UserGroup)
    private userGroupsRepository: Repository<UserGroup>,
  ) {}

  async create(createUserGroupDto: CreateUserGroupDto): Promise<UserGroup> {
    // Check if user is already in the group
    const existingUserGroup = await this.userGroupsRepository.findOne({
      where: {
        user_id: createUserGroupDto.userId,
        group_id: createUserGroupDto.groupId
      }
    });

    if (existingUserGroup) {
      throw new ConflictException('User is already a member of this group');
    }

    // Map DTO fields to entity fields
    const userGroupData = {
      user_id: createUserGroupDto.userId,
      group_id: createUserGroupDto.groupId,
      added_by: createUserGroupDto.addedBy
    };

    const userGroup = this.userGroupsRepository.create(userGroupData);
    const savedUserGroup = await this.userGroupsRepository.save(userGroup);
    return savedUserGroup;
  }

  async findAll(): Promise<UserGroup[]> {
    return await this.userGroupsRepository.find();
  }

  async findByUser(userId: string): Promise<UserGroup[]> {
    return await this.userGroupsRepository.find({
      where: { user_id: userId }
    });
  }

  async findByGroup(groupId: string): Promise<UserGroup[]> {
    return await this.userGroupsRepository.find({
      where: { group_id: groupId }
    });
  }

  async findOne(userId: string, groupId: string): Promise<UserGroup> {
    const userGroup = await this.userGroupsRepository.findOne({
      where: {
        user_id: userId,
        group_id: groupId
      }
    });

    if (!userGroup) {
      throw new NotFoundException(`User-Group relationship not found`);
    }

    return userGroup;
  }

  async remove(userId: string, groupId: string): Promise<void> {
    const userGroup = await this.findOne(userId, groupId);
    await this.userGroupsRepository.remove(userGroup);
  }

  async removeUserFromAllGroups(userId: string): Promise<void> {
    await this.userGroupsRepository.delete({ user_id: userId });
  }

  async removeAllUsersFromGroup(groupId: string): Promise<void> {
    await this.userGroupsRepository.delete({ group_id: groupId });
  }

  async getUsersByTenant(tenantId: string): Promise<UserGroup[]> {
    return await this.userGroupsRepository
      .createQueryBuilder('ug')
      .innerJoin('ug.group', 'group')
      .where('group.tenant_id = :tenantId', { tenantId })
      .getMany();
  }

  async getGroupMemberCount(groupId: string): Promise<number> {
    return await this.userGroupsRepository.count({
      where: { group_id: groupId }
    });
  }

  async update(userId: string, groupId: string, updateUserGroupDto: UpdateUserGroupDto): Promise<UserGroup> {
    const userGroup = await this.findOne(userId, groupId);
    
    // Merge the updates
    Object.assign(userGroup, updateUserGroupDto);
    
    return await this.userGroupsRepository.save(userGroup);
  }
}