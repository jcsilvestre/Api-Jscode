import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantOwnershipHistory } from './tenant-ownership-history.entity';
import { CreateTenantOwnershipHistoryDto } from './dto/create-tenant-ownership-history.dto';
import { UpdateTenantOwnershipHistoryDto } from './dto/update-tenant-ownership-history.dto';

@Injectable()
export class TenantOwnershipHistoryService {
  constructor(
    @InjectRepository(TenantOwnershipHistory)
    private tenantOwnershipHistoryRepository: Repository<TenantOwnershipHistory>,
  ) {}

  async create(createTenantOwnershipHistoryDto: CreateTenantOwnershipHistoryDto): Promise<TenantOwnershipHistory> {
    // Map DTO fields to entity fields
    const historyData = {
      tenant_id: createTenantOwnershipHistoryDto.tenantId,
      previous_owner: createTenantOwnershipHistoryDto.previousOwner,
      new_owner: createTenantOwnershipHistoryDto.newOwner,
      reason: createTenantOwnershipHistoryDto.reason,
      transferred_by: createTenantOwnershipHistoryDto.transferredBy
    };

    const history = this.tenantOwnershipHistoryRepository.create(historyData);
    return await this.tenantOwnershipHistoryRepository.save(history);
  }

  async findAll(): Promise<TenantOwnershipHistory[]> {
    return await this.tenantOwnershipHistoryRepository.find({
      order: { transferred_at: 'DESC' }
    });
  }

  async findByTenant(tenantId: string): Promise<TenantOwnershipHistory[]> {
    return await this.tenantOwnershipHistoryRepository.find({
      where: { tenant_id: tenantId },
      order: { transferred_at: 'DESC' }
    });
  }

  async findByUser(userId: string): Promise<TenantOwnershipHistory[]> {
    return await this.tenantOwnershipHistoryRepository
      .createQueryBuilder('history')
      .where('history.previous_owner = :userId OR history.new_owner = :userId', { userId })
      .orderBy('history.transferred_at', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<TenantOwnershipHistory> {
    const history = await this.tenantOwnershipHistoryRepository.findOne({
      where: { id }
    });

    if (!history) {
      throw new NotFoundException(`Ownership history record with ID ${id} not found`);
    }

    return history;
  }

  async update(id: string, updateTenantOwnershipHistoryDto: UpdateTenantOwnershipHistoryDto): Promise<TenantOwnershipHistory> {
    const history = await this.findOne(id);

    Object.assign(history, updateTenantOwnershipHistoryDto);
    return await this.tenantOwnershipHistoryRepository.save(history);
  }

  async remove(id: string): Promise<void> {
    const history = await this.findOne(id);
    await this.tenantOwnershipHistoryRepository.remove(history);
  }

  async createOwnershipTransfer(
    tenantId: string,
    previousOwner: string,
    newOwner: string,
    transferredBy?: string,
    reason?: string
  ): Promise<TenantOwnershipHistory> {
    const createDto: CreateTenantOwnershipHistoryDto = {
      tenantId: tenantId,
      previousOwner: previousOwner,
      newOwner: newOwner,
      transferredBy: transferredBy,
      reason
    };

    return await this.create(createDto);
  }

  async getOwnershipHistory(
    tenantId?: string,
    userId?: string,
    limit: number = 100
  ): Promise<TenantOwnershipHistory[]> {
    const query = this.tenantOwnershipHistoryRepository.createQueryBuilder('history')
      .orderBy('history.transferred_at', 'DESC')
      .limit(limit);

    if (tenantId) {
      query.andWhere('history.tenant_id = :tenantId', { tenantId });
    }

    if (userId) {
      query.andWhere('(history.previous_owner = :userId OR history.new_owner = :userId)', { userId });
    }

    return await query.getMany();
  }

  async getCurrentOwner(tenantId: string): Promise<TenantOwnershipHistory | null> {
    return await this.tenantOwnershipHistoryRepository.findOne({
      where: { tenant_id: tenantId },
      order: { transferred_at: 'DESC' }
    });
  }
}