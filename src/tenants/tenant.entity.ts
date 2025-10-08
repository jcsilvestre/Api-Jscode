import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Group } from '../groups/group.entity';
import { UserInvitation } from '../user-invitations/user-invitation.entity';
import { TenantOwnershipHistory } from '../tenant-ownership-history/tenant-ownership-history.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  owner_user_id: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'integer', default: 10 })
  max_users: number;

  @Column({ type: 'integer', default: 0 })
  current_users_count: number;

  @Column({ type: 'timestamp', nullable: true })
  suspended_at: Date | null;

  @Column({ type: 'text', nullable: true })
  suspended_reason: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  suspension_type: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Group, group => group.tenant)
  groups: Group[];

  @OneToMany(() => UserInvitation, invitation => invitation.tenant)
  invitations: UserInvitation[];
}