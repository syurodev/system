export class UserEntity {
  id: string = "";
  name: string = "";
  username: string = "";
  display_username: string = "";
  email: string = "";
  email_verified: boolean = false;
  is_anonymous: boolean = false;
  image: string = "";
  metadata: Object = {};
  created_at: Date | string = "";
  updated_at: Date | string = "";

  constructor() {}

  // return a plain object
  toJSON() {
    return { ...this };
  }

  static getTableName(): string {
    return "users";
  }

  /**
   * Create UserEntity from database row
   * 
   * @description Maps raw database row data to a UserEntity instance.
   * This static method provides a clean way to create user entities from database results.
   * 
   * @param {any} row - Raw database row from PostgreSQL query
   * @returns {UserEntity} New UserEntity instance with mapped data
   * 
   * @example
   * ```typescript
   * const user = UserEntity.fromRow({
   *   id: 'uuid-here',
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   // ... other database fields
   * });
   * ```
   */
  static fromRow(row: any): UserEntity {
    const user = new UserEntity();
    user.id = row.id;
    user.name = row.name || "";
    user.username = row.username || "";
    user.display_username = row.display_username || "";
    user.email = row.email || "";
    user.email_verified = row.email_verified || false;
    user.is_anonymous = row.is_anonymous || false;
    user.image = row.image || "";
    user.metadata = row.metadata || {};
    user.created_at = row.created_at;
    user.updated_at = row.updated_at;
    return user;
  }

  /**
   * Create multiple UserEntity instances from database rows
   * 
   * @description Efficiently maps an array of database rows to UserEntity instances.
   * Useful for bulk operations and query results with multiple users.
   * 
   * @param {any[]} rows - Array of raw database rows
   * @returns {UserEntity[]} Array of mapped UserEntity instances
   * 
   * @example
   * ```typescript
   * const users = UserEntity.fromRows([
   *   { id: '1', name: 'John', email: 'john@example.com' },
   *   { id: '2', name: 'Jane', email: 'jane@example.com' }
   * ]);
   * ```
   */
  static fromRows(rows: any[]): UserEntity[] {
    return rows.map(row => UserEntity.fromRow(row));
  }
}
