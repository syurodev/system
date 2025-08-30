import { BaseEntity } from "./base.entity";

export class UserRoleEntity extends BaseEntity {
  user_id: string = "";
  role_id: string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "user_roles";
  }
}
