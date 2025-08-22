import { TeamMemberRole } from "@repo/types";

export class TeamMemberEntity {
  team_id: string = "";
  user_id: string = "";
  role: TeamMemberRole = TeamMemberRole.OWNER;

  constructor() {}

  toJSON() {
    return { ...this };
  }
}
