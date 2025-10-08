import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Group } from '../groups/group.entity';

@Entity('users_groups')
export class UserGroup {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn('uuid')
  group_id: string;

  @CreateDateColumn()
  joined_at: Date;

  @Column({ type: 'uuid', nullable: true })
  added_by: string;

  // Relationships
  @ManyToOne(() => User, user => user.userGroups)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Group, group => group.userGroups)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'added_by' })
  addedByUser: User;
}