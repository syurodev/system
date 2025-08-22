export class UserRoleEntity {
  user_id: string = "";
  role_id: string = "";

  constructor() {}

  toJSON() {
    return { ...this };
  }
}
