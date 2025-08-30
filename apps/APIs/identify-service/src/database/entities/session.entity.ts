import { BaseEntity } from "./base.entity";

export class SessionEntity extends BaseEntity {
  user_id: string = "";
  token: string = "";
  expires_at: Date | string = "";
  ip_address: string = "";
  user_agent: string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "sessions";
  }
}
