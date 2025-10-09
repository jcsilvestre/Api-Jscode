import { Entity, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'v_tenant_stats',
  expression: `
    SELECT 
      t.id,
      t.name,
      t.slug,
      COUNT(u.id) as current_users_count,
      t.max_users,
      t.is_active,
      COUNT(DISTINCT g.id) as total_groups,
      COUNT(DISTINCT ug.user_id) as users_in_groups,
      t.created_at
    FROM tenants t
    LEFT JOIN users u ON t.id = u.tenant_id
    LEFT JOIN groups g ON t.id = g.tenant_id
    LEFT JOIN users_groups ug ON g.id = ug.group_id
    GROUP BY t.id, t.name, t.slug, t.max_users, t.is_active, t.created_at
  `
})
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