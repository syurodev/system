import { BaseEntity } from "./base.entity";

export class RoleEntity extends BaseEntity {
  name: string = "";
  is_system: boolean = false;
  description: string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "roles";
  }
}
