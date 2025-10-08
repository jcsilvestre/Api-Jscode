import { Entity, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity('v_tenant_stats')
export class TenantStats {
  @ViewColumn()
  id: string;

  @ViewColumn()
  name: string;

  @ViewColumn()
  slug: string;

  @ViewColumn()
  current_users_count: number;

  @ViewColumn()
  max_users: number;

  @ViewColumn()
  is_active: boolean;

  @ViewColumn()
  total_groups: number;

  @ViewColumn()
  users_in_groups: number;

  @ViewColumn()
  created_at: Date;
}