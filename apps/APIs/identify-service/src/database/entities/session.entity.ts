export class SessionEntity {
  id: string = "";
  user_id: string = "";
  token: string = "";
  expires_at: Date | string = "";
  ip_address: string = "";
  user_agent: string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {}

  toJSON() {
    return { ...this };
  }
}
