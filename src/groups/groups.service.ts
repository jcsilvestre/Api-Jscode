import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    // Check if group name already exists for the tenant
    const existingGroup = await this.groupsRepository.findOne({
      where: { 
        name: createGroupDto.name,
        tenant_id: createGroupDto.tenantId
      }
    });

    if (existingGroup) {
      throw new ConflictException('Group with this name already exists for this tenant');
    }

    // Map DTO fields to entity fields
    const groupData: any = {
      name: createGroupDto.name,
      description: createGroupDto.description,
      tenant_id: createGroupDto.tenantId
    };

    // Only add parent_group_id if it's provided
    if (createGroupDto.parentGroupId) {
      groupData.parent_group_id = createGroupDto.parentGroupId;
    }

    return await this.groupsRepository.save(groupData);
  }

  async findAll(): Promise<Group[]> {
    return await this.groupsRepository.find();
  }

  async findByTenant(tenantId: string): Promise<Group[]> {
    return await this.groupsRepository.find({
      where: { tenant_id: tenantId }
    });
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { id }
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);

    // Check if name is being updated and if it already exists for the tenant
    if (updateGroupDto.name && updateGroupDto.name !== group.name) {
      const existingGroup = await this.groupsRepository.findOne({
        where: { 
          name: updateGroupDto.name,
          tenant_id: group.tenant_id
        }
      });

      if (existingGroup) {
        throw new ConflictException('Group with this name already exists for this tenant');
      }
    }

    Object.assign(group, updateGroupDto);
    return await this.groupsRepository.save(group);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    
    // Check if group has children
    if (group.children && group.children.length > 0) {
      throw new ConflictException('Cannot delete group that has child groups');
    }

    await this.groupsRepository.remove(group);
  }

  async findRootGroups(tenantId: string): Promise<Group[]> {
    return await this.groupsRepository.find({
      where: { 
        tenant_id: tenantId,
        parent_group_id: undefined
      }
    });
  }

  async findGroupHierarchy(groupId: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId }
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    return group;
  }
}