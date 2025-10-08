import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'inet', nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({ type: 'timestamp' })
  login_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  logout_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}