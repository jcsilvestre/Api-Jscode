import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { UserGroup } from '../user-groups/user-group.entity';
import { GroupSettings } from '../group-settings/group-settings.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_group_id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Tenant, tenant => tenant.groups)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Group, group => group.children, { nullable: true })
  @JoinColumn({ name: 'parent_group_id' })
  parent: Group;

  @OneToMany(() => Group, group => group.parent)
  children: Group[];

  @OneToMany(() => UserGroup, userGroup => userGroup.group)
  userGroups: UserGroup[];

  @OneToMany(() => GroupSettings, settings => settings.group)
  settings: GroupSettings[];
}