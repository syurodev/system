import { BaseEntity } from "./base.entity";

export class PasskeyEntity extends BaseEntity {
  name: string = "";
  public_key: string = "";
  user_id: string = "";
  credential_id: string = "";
  counter: string | number = 0;
  device_type: string = "";
  backed_up: boolean = false;
  transports: string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";
  aaguid: string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "passkeys";
  }
}
