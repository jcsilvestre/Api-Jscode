import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveUser } from './entities/active-user.entity';
import { GroupWithMemberCount } from './entities/group-with-member-count.entity';
import { TenantStats } from './entities/tenant-stats.entity';

@Injectable()
export class DatabaseViewsService {
  constructor(
    @InjectRepository(ActiveUser)
    private activeUsersRepository: Repository<ActiveUser>,
    @InjectRepository(GroupWithMemberCount)
    private groupsWithMemberCountRepository: Repository<GroupWithMemberCount>,
    @InjectRepository(TenantStats)
    private tenantStatsRepository: Repository<TenantStats>,
  ) {}

  // Active Users View
  async getActiveUsers(): Promise<ActiveUser[]> {
    return await this.activeUsersRepository.find();
  }

  async getActiveUserByUuid(uuid: string): Promise<ActiveUser> {
    const user = await this.activeUsersRepository.findOne({
      where: { uuid }
    });

    if (!user) {
      throw new NotFoundException(`Active user with UUID ${uuid} not found`);
    }

    return user;
  }

  // Groups with Member Count View
  async getGroupsWithMemberCount(): Promise<GroupWithMemberCount[]> {
    return await this.groupsWithMemberCountRepository.find();
  }

  async getGroupWithMemberCountById(id: string): Promise<GroupWithMemberCount> {
    const group = await this.groupsWithMemberCountRepository.findOne({
      where: { id }
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async getGroupsWithMemberCountByTenant(tenantName: string): Promise<GroupWithMemberCount[]> {
    return await this.groupsWithMemberCountRepository.find({
      where: { tenant_name: tenantName }
    });
  }

  // Tenant Stats View
  async getTenantStats(): Promise<TenantStats[]> {
    return await this.tenantStatsRepository.find();
  }

  async getTenantStatsById(id: string): Promise<TenantStats> {
    const stats = await this.tenantStatsRepository.findOne({
      where: { id }
    });

    if (!stats) {
      throw new NotFoundException(`Tenant stats with ID ${id} not found`);
    }

    return stats;
  }

  async getTenantStatsBySlug(slug: string): Promise<TenantStats> {
    const stats = await this.tenantStatsRepository.findOne({
      where: { slug }
    });

    if (!stats) {
      throw new NotFoundException(`Tenant stats with slug ${slug} not found`);
    }

    return stats;
  }
}