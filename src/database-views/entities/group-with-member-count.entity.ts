import { Entity, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'v_groups_with_member_count',
  expression: `
    SELECT 
      g.id,
      g.name,
      g.description,
      t.name as tenant_name,
      COUNT(ug.user_id) as member_count,
      g.created_at
    FROM groups g
    LEFT JOIN tenants t ON g.tenant_id = t.id
    LEFT JOIN users_groups ug ON g.id = ug.group_id
    GROUP BY g.id, g.name, g.description, t.name, g.created_at
  `
})
export class GroupWithMemberCount {
  @ViewColumn()
  id: string;

  @ViewColumn()
  name: string;

  @ViewColumn()
  description: string;

  @ViewColumn()
  tenant_name: string;

  @ViewColumn()
  member_count: number;

  @ViewColumn()
  created_at: Date;
}