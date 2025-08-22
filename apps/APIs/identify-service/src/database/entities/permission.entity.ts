export class PermissionEntity {
  id: string = "";
  name: string = "";

  constructor() {}

  toJSON() {
    return { ...this };
  }
}
