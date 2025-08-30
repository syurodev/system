import { BaseEntity } from "./base.entity";

export class UserEntity extends BaseEntity {
  name: string = "";
  username: string = "";
  display_username: string = "";
  email: string = "";
  email_verified: boolean = false;
  is_anonymous: boolean = false;
  image: string = "";
  metadata: Object = {};
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "users";
  }
}
