import { Entity, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'v_active_users',
  expression: `
    SELECT 
      u.uuid,
      u.full_name,
      u.email,
      u.username,
      u.is_tenant_admin,
      t.name as tenant_name,
      t.slug as tenant_slug,
      u.last_login,
      u.created_at
    FROM users u
    LEFT JOIN tenants t ON u.tenant_id = t.id
    WHERE u.last_login > (CURRENT_TIMESTAMP - INTERVAL '30 days')
  `
})
export class ActiveUser {
  @ViewColumn()
  uuid: string;

  @ViewColumn()
  full_name: string;

  @ViewColumn()
  email: string;

  @ViewColumn()
  username: string;

  @ViewColumn()
  is_tenant_admin: boolean;

  @ViewColumn()
  tenant_name: string;

  @ViewColumn()
  tenant_slug: string;

  @ViewColumn()
  last_login: Date;

  @ViewColumn()
  created_at: Date;
}