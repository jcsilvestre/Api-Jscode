import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from '../groups/group.entity';

@Entity('group_settings')
export class GroupSettings {
  @PrimaryColumn('uuid')
  group_id: string;

  @Column({ type: 'varchar', length: 7, nullable: true, default: '#3B82F6' })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  settings: any;

  // Relationships
  @ManyToOne(() => Group, group => group.settings)
  @JoinColumn({ name: 'group_id' })
  group: Group;
}