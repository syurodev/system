import { BaseEntity } from "./base.entity";

export class RolePermissionEntity extends BaseEntity {
  role_id: string = "";
  permission_id: string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "role_permissions";
  }
}
