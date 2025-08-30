import { TeamMemberRole } from "@repo/types";
import { BaseEntity } from "./base.entity";

export class TeamMemberEntity extends BaseEntity {
  team_id: string = "";
  user_id: string = "";
  role: TeamMemberRole = TeamMemberRole.OWNER;

  constructor() {
    super();
  }

  static getTableName(): string {
    return "team_members";
  }
}
