export class RoleEntity {
  id: string = "";
  name: string = "";

  constructor() {}

  toJSON() {
    return { ...this };
  }
}
