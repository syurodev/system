export class VerificationEntity {
  id: string = "";
  identifier: string = "";
  value: string = "";
  expires_at: Date | string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {}

  toJSON() {
    return { ...this };
  }
}
