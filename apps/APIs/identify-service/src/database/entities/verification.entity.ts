import { BaseEntity } from "./base.entity";

export class VerificationEntity extends BaseEntity {
  identifier: string = "";
  value: string = "";
  expires_at: Date | string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "verifications";
  }
}
