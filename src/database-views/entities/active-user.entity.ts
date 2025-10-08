import { Entity, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity('v_active_users')
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