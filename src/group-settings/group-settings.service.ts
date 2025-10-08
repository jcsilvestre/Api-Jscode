import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupSettings } from './group-settings.entity';
import { CreateGroupSettingsDto } from './dto/create-group-settings.dto';
import { UpdateGroupSettingsDto } from './dto/update-group-settings.dto';

@Injectable()
export class GroupSettingsService {
  constructor(
    @InjectRepository(GroupSettings)
    private groupSettingsRepository: Repository<GroupSettings>,
  ) {}

  async create(createGroupSettingsDto: CreateGroupSettingsDto): Promise<GroupSettings> {
    // Check if settings already exist for this group
    const existingSettings = await this.groupSettingsRepository.findOne({
      where: { group_id: createGroupSettingsDto.groupId }
    });

    if (existingSettings) {
      throw new ConflictException('Settings already exist for this group');
    }

    // Map DTO fields to entity fields
    const settingsData = {
      group_id: createGroupSettingsDto.groupId,
      color: createGroupSettingsDto.color,
      icon: createGroupSettingsDto.icon,
      is_default: createGroupSettingsDto.isDefault,
      settings: createGroupSettingsDto.settings
    };

    const settings = this.groupSettingsRepository.create(settingsData);
    return await this.groupSettingsRepository.save(settings);
  }

  async findAll(): Promise<GroupSettings[]> {
    return await this.groupSettingsRepository.find({
      relations: ['group']
    });
  }

  async findOne(groupId: string): Promise<GroupSettings> {
    const settings = await this.groupSettingsRepository.findOne({
      where: { group_id: groupId },
      relations: ['group']
    });

    if (!settings) {
      throw new NotFoundException(`Settings for group ${groupId} not found`);
    }

    return settings;
  }

  async update(groupId: string, updateGroupSettingsDto: UpdateGroupSettingsDto): Promise<GroupSettings> {
    const settings = await this.findOne(groupId);

    Object.assign(settings, updateGroupSettingsDto);
    return await this.groupSettingsRepository.save(settings);
  }

  async remove(groupId: string): Promise<void> {
    const settings = await this.findOne(groupId);
    await this.groupSettingsRepository.remove(settings);
  }

  async findByTenant(tenantId: string): Promise<GroupSettings[]> {
    return await this.groupSettingsRepository
      .createQueryBuilder('gs')
      .leftJoinAndSelect('gs.group', 'group')
      .where('group.tenant_id = :tenantId', { tenantId })
      .getMany();
  }

  async setAsDefault(groupId: string): Promise<GroupSettings> {
    // First, remove default flag from all other settings in the same tenant
    const settings = await this.findOne(groupId);
    
    await this.groupSettingsRepository
      .createQueryBuilder()
      .update(GroupSettings)
      .set({ is_default: false })
      .where('group_id IN (SELECT id FROM groups WHERE tenant_id = (SELECT tenant_id FROM groups WHERE id = :groupId))', { groupId })
      .execute();

    // Set this group as default
    settings.is_default = true;
    return await this.groupSettingsRepository.save(settings);
  }
}