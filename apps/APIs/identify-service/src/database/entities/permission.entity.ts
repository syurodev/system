import { BaseEntity } from "./base.entity";

export class PermissionEntity extends BaseEntity {
  name: string = "";
  description: string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "permissions";
  }
}
