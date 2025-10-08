import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tenant_ownership_history')
export class TenantOwnershipHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  previous_owner: string;

  @Column({ type: 'uuid' })
  new_owner: string;

  @Column({ type: 'uuid', nullable: true })
  transferred_by: string;

  @CreateDateColumn()
  transferred_at: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;
}