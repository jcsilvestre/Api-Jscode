import { Entity, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity('v_groups_with_member_count')
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