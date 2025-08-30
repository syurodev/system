export abstract class BaseEntity {
  id: string = "";

  constructor() {}

  toJSON() {
    return { ...this };
  }

  static fromRow<T extends BaseEntity>(this: new () => T, row: any): T {
    const instance = new this();
    Object.assign(instance, row);
    return instance;
  }

  static fromRows<T extends BaseEntity>(
    this: { new (): T; fromRow: (row: any) => T },
    rows: any[],
  ): T[] {
    return rows.map((row) => this.fromRow(row));
  }
}
