import { BaseEntity } from "./base.entity";

export class TeamEntity extends BaseEntity {
  owner_user_id: string = "";
  name: string = "";
  slug: string = "";
  logo_url: string = "";
  description: string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {
    super();
  }

  static getTableName(): string {
    return "teams";
  }
}
