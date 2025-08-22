export class PasskeyEntity {
  id: string = "";
  name: string = "";
  public_key: string = "";
  user_id: string = "";
  credential_id: string = "";
  counter: string | number = 0;
  device_type: string = "";
  backed_up: boolean = false;
  transports: string = "";
  created_at: Date | string = "";
  aaguid: string = "";

  constructor() {}

  toJSON() {
    return { ...this };
  }
}
