export class RolePermissionEntity {
  role_id: string = "";
  permission_id: string = "";

  constructor() {}

  toJSON() {
    return { ...this };
  }
}
