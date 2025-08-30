import { BaseEntity } from "./base.entity";

export class AccountEntity extends BaseEntity {
  user_id: string = "";
  provider_id: string = "";
  account_id: string = "";
  access_token: string = "";
  refresh_token: string = "";
  access_token_expires_at: Date | string = "";
  refresh_token_expires_at: Date | string = "";
  scope: string = "";
  id_token: string = "";
  password: string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "accounts";
  }
}
