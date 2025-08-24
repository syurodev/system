import { SQL } from "bun";
import { getDatabase } from "./pg";
import type {
  BaseEntity,
  FindManyOptions,
  IRepository,
  PaginationResult,
  Transaction,
} from "./repository";

/**
 * Abstract base repository class providing common CRUD operations
 * All repositories should extend this class for consistency
 */
export abstract class BaseRepository<T extends BaseEntity>
  implements IRepository<T>
{
  protected readonly tableName: string;
  protected sql: InstanceType<typeof SQL>;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.sql = getDatabase().getClient();
  }

  /**
   * Find entity by ID
   */
  async findById(id: string, tx?: Transaction): Promise<T | null> {
    try {
      const client = tx || this.sql;
      const [result] = await client`
        SELECT * FROM ${client(this.tableName)}
        WHERE id = ${id}
        LIMIT 1
      `;
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by ID:`, error);
      return null;
    }
  }

  /**
   * Find a single entity with options
   */
  async findOne(
    options: FindManyOptions = {},
    tx?: Transaction,
  ): Promise<T | null> {
    try {
      const client = tx || this.sql;
      const query = this.buildQuery({ ...options, limit: 1 });
      const [result] = await client.unsafe(query);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      console.error(`Error finding one ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Find multiple entities with options
   */
  async find(options: FindManyOptions = {}, tx?: Transaction): Promise<T[]> {
    try {
      const client = tx || this.sql;
      const query = this.buildQuery(options);
      const results = await client.unsafe(query);
      return results.map((row: any) => this.mapToEntity(row));
    } catch (error) {
      console.error(`Error finding ${this.tableName}:`, error);
      return [];
    }
  }

  /**
   * Find all entities (legacy method for compatibility)
   */
  async findAll(options: FindManyOptions = {}, tx?: Transaction): Promise<T[]> {
    return this.find(options, tx);
  }

  /**
   * Find many entities with pagination
   */
  async findMany(
    options: FindManyOptions = {},
    tx?: Transaction,
  ): Promise<PaginationResult<T>> {
    try {
      const { limit = 10, offset = 0 } = options;
      const client = tx || this.sql;

      // Get total count
      const countQuery = this.buildCountQuery(options.where);
      const [countResult] = await client.unsafe(countQuery);
      const total = parseInt(countResult?.count || "0", 10);

      // Get data
      const data = await this.find(options, tx);

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error(`Error finding many ${this.tableName}:`, error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: options.limit || 10,
        totalPages: 0,
      };
    }
  }

  /**
   * Save a single entity (create or update)
   */
  async save(entity: Partial<T>, tx?: Transaction): Promise<T> {
    try {
      if ("id" in entity && entity.id) {
        const updated = await this.update(entity.id as string, entity, tx);
        if (!updated) {
          throw new Error(
            `Failed to update ${this.tableName} with id ${entity.id}`,
          );
        }
        return updated;
      }
      return this.create(
        entity as Omit<T, "id" | "created_at" | "updated_at">,
        tx,
      );
    } catch (error) {
      console.error(`Error saving ${this.tableName}:`, error);
      throw error; // Re-throw to let transaction rollback
    }
  }

  /**
   * Save multiple entities in batch
   */
  async saveAll(entities: Partial<T>[], tx?: Transaction): Promise<T[]> {
    if (entities.length === 0) return [];

    try {
      if (tx) {
        // Use provided transaction - process sequentially
        const results: T[] = [];
        for (const entity of entities) {
          const saved = await this.save(entity, tx);
          results.push(saved);
        }
        return results;
      }

      // Create a new transaction using Bun SQL .begin()
      return await this.sql.begin(async (txn) => {
        const results: T[] = [];

        // Check if we can use batch optimization (all creations)
        const allCreates = entities.every(
          (entity) => !("id" in entity && entity.id),
        );

        if (allCreates && entities.length > 1) {
          // Use Bun's array return pattern for batch creations
          return this.batchCreate(
            entities as Omit<T, "id" | "created_at" | "updated_at">[],
            txn,
          );
        }

        // Mixed creates/updates - process individually
        for (const entity of entities) {
          const saved = await this.save(entity, txn);
          results.push(saved);
        }
        return results;
      });
    } catch (error) {
      console.error(`Error in batch save ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Optimized batch create using Bun's array return pattern
   */
  protected async batchCreate(
    entities: Omit<T, "id" | "created_at" | "updated_at">[],
    tx: Transaction,
  ): Promise<T[]> {
    if (entities.length === 0) return [];

    try {
      const client = tx || this.sql;
      const firstEntity = entities[0];
      if (!firstEntity) return [];

      const fields = Object.keys(firstEntity);
      const insertFields = fields.join(", ");
      const placeholders = fields.map(() => "?").join(", ");

      // Build values arrays for each entity
      const valueArrays = entities.map((entity) => Object.values(entity));
      const allValues = valueArrays.flat();

      // Create a placeholder string for all rows
      const rowPlaceholders = entities
        .map(() => `(${placeholders}, NOW(), NOW())`)
        .join(", ");

      const query = `
        INSERT INTO ${this.tableName} (${insertFields}, created_at, updated_at)
        VALUES ${rowPlaceholders}
        RETURNING *
      `;

      const results = await client.unsafe(query, allValues);
      return results.map((row: any) => this.mapToEntity(row));
    } catch (error) {
      console.error(`Error in batch create ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new entity
   */
  async create(
    data: Omit<T, "id" | "created_at" | "updated_at">,
    tx?: Transaction,
  ): Promise<T> {
    try {
      const client = tx || this.sql;
      const fields = Object.keys(data);
      const values = Object.values(data);

      const insertFields = fields.join(", ");
      const placeholders = fields.map(() => "?").join(", ");

      const [result] = await client.unsafe(
        `
        INSERT INTO ${this.tableName} (${insertFields}, created_at, updated_at)
        VALUES (${placeholders}, NOW(), NOW())
        RETURNING *
      `,
        values,
      );

      if (!result) {
        throw new Error(`Failed to create ${this.tableName}`);
      }

      return this.mapToEntity(result);
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update entity by ID
   */
  async update(
    id: string,
    data: Partial<Omit<T, "id" | "created_at" | "updated_at">>,
    tx?: Transaction,
  ): Promise<T | null> {
    try {
      const client = tx || this.sql;
      const fields = Object.keys(data);
      const values = Object.values(data);

      if (fields.length === 0) {
        return this.findById(id, tx);
      }

      const setClause = fields.map((field) => `${field} = ?`).join(", ");

      const [result] = await client.unsafe(
        `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = NOW()
        WHERE id = ?
        RETURNING *
      `,
        [...values, id],
      );

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      const result = await client`
        DELETE FROM ${client(this.tableName)}
        WHERE id = ${id}
      `;
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return false;
    }
  }

  /**
   * Check if an entity exists by ID
   */
  async exists(id: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      const [result] = await client`
        SELECT 1 FROM ${client(this.tableName)}
        WHERE id = ${id}
        LIMIT 1
      `;
      return !!result;
    } catch (error) {
      console.error(`Error checking if ${this.tableName} exists:`, error);
      return false;
    }
  }

  /**
   * Count entities with optional where conditions
   */
  async count(
    where: Record<string, any> = {},
    tx?: Transaction,
  ): Promise<number> {
    try {
      const client = tx || this.sql;
      const query = this.buildCountQuery(where);
      const [result] = await client.unsafe(query);
      return parseInt(result?.count || "0", 10);
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      return 0;
    }
  }

  /**
   * Build SQL query with options
   */
  protected buildQuery(options: FindManyOptions = {}): string {
    let query = `SELECT * FROM ${this.tableName}`;

    // WHERE clause
    if (options.where) {
      const conditions = this.buildWhereClause(options.where);
      if (conditions) {
        query += ` WHERE ${conditions}`;
      }
    }

    // ORDER BY clause
    if (options.orderBy) {
      const direction = options.orderDirection || "ASC";
      query += ` ORDER BY ${options.orderBy} ${direction}`;
    }

    // LIMIT and OFFSET
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }

    return query;
  }

  /**
   * Build count query with where conditions
   */
  protected buildCountQuery(where: Record<string, any> = {}): string {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;

    const conditions = this.buildWhereClause(where);
    if (conditions) {
      query += ` WHERE ${conditions}`;
    }

    return query;
  }

  /**
   * Build WHERE clause from a conditions object
   */
  protected buildWhereClause(where: Record<string, any>): string {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        conditions.push(`${key} IS NULL`);
      } else if (value === undefined) {
        continue;
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => "?").join(", ");
        conditions.push(`${key} IN (${placeholders})`);
      } else if (typeof value === "object" && value.operator) {
        // Support for complex operators like { operator: "LIKE", value: "%test%" }
        conditions.push(`${key} ${value.operator} ?`);
      } else {
        conditions.push(`${key} = ?`);
      }
    }

    return conditions.join(" AND ");
  }

  /**
   * Map database row to entity
   * Subclasses should override this method for custom mapping
   */
  protected abstract mapToEntity(row: any): T;

  /**
   * Get table name (for debugging/logging)
   */
  protected getTableName(): string {
    return this.tableName;
  }
}
