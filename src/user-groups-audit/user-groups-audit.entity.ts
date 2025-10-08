import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users_groups_audit')
export class UserGroupsAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @Column({ type: 'varchar', length: 10 })
  action: string; // 'added' or 'removed'

  @Column({ type: 'uuid' })
  performed_by: string;

  @CreateDateColumn()
  performed_at: Date;
}