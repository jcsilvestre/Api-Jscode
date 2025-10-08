import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Check if slug already exists
    const existingTenant = await this.tenantsRepository.findOne({
      where: { slug: createTenantDto.slug }
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    const tenant = this.tenantsRepository.create(createTenantDto);
    return await this.tenantsRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return await this.tenantsRepository.find();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id }
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { slug }
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // Check if slug is being updated and if it already exists
    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const existingTenant = await this.tenantsRepository.findOne({
        where: { slug: updateTenantDto.slug }
      });

      if (existingTenant) {
        throw new ConflictException('Tenant with this slug already exists');
      }
    }

    Object.assign(tenant, updateTenantDto);
    return await this.tenantsRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantsRepository.remove(tenant);
  }

  async suspend(id: string, reason: string, suspensionType: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    tenant.is_active = false;
    tenant.suspended_at = new Date();
    tenant.suspended_reason = reason;
    tenant.suspension_type = suspensionType;

    return await this.tenantsRepository.save(tenant);
  }

  async reactivate(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    tenant.is_active = true;
    tenant.suspended_at = null;
    tenant.suspended_reason = null;
    tenant.suspension_type = null;

    return await this.tenantsRepository.save(tenant);
  }
}