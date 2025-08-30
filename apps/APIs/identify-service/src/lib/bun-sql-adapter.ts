import {
  type AdapterDebugLogs,
  createAdapter,
  CustomAdapter,
} from "better-auth/adapters";
import { getDatabase } from "@repo/elysia";

interface BunSQLAdapterConfig {
  /**
   * Helps you debug issues with the adapter.
   */
  debugLogs?: AdapterDebugLogs;
  /**
   * If the table names in the schema are plural.
   */
  usePlural?: boolean;
}

/**
 * Helper function to transform database result keys to Better Auth format
 * Adapted from sample adapter
 */
const transformKeys = (obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;

  const keyMappings: Record<string, string> = {
    // User table mappings (snake_case -> camelCase)
    email_verified: "emailVerified",
    created_at: "createdAt",
    updated_at: "updatedAt",
    full_name: "fullName",
    is_active: "isActive",
    last_login_at: "lastLoginAt",
    two_factor_enabled: "twoFactorEnabled",
    ban_reason: "banReason",
    ban_expires: "banExpires",

    // Session table mappings
    expires_at: "expiresAt",
    ip_address: "ipAddress",
    user_agent: "userAgent",
    user_id: "userId",
    impersonated_by: "impersonatedBy",

    // Account table mappings
    account_id: "accountId",
    provider_id: "providerId",
    access_token: "accessToken",
    refresh_token: "refreshToken",
    id_token: "idToken",
    access_token_expires_at: "accessTokenExpiresAt",
    refresh_token_expires_at: "refreshTokenExpiresAt",

    // Two factor mappings
    backup_codes: "backupCodes",

    // Passkey mappings
    public_key: "publicKey",
    credential_id: "credentialID",
    device_type: "deviceType",
    backed_up: "backedUp",

    // Rate limit mappings
    last_reset: "lastReset",

    // Legacy lowercase mappings (for backwards compatibility)
    access_token_expiresat: "accessTokenExpiresAt",
    refresh_tokene_xpiresat: "refreshTokenExpiresAt",
  };

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = keyMappings[key] || key;
    transformed[newKey] = value;
  }
  return transformed;
};

/**
 * Custom Better Auth adapter for Bun SQL with PostgreSQL
 */
export const bunSQLAdapter = (config: BunSQLAdapterConfig = {}) =>
  createAdapter({
    config: {
      adapterId: "bun-sql",
      adapterName: "Bun SQL Adapter",
      usePlural: config.usePlural ?? true, // Our schema uses plural table names
      debugLogs: config.debugLogs ?? false,
      supportsJSON: true, // PostgreSQL supports JSON
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: false, // We use UUIDs
    },
    adapter: (): CustomAdapter => {
      // Database connection helper (sử dụng connection đã init từ @repo/elysia)
      let _cachedDb: any = null;
      const getDb = () => {
        if (!_cachedDb) {
          _cachedDb = getDatabase().getClient();
        }
        return _cachedDb;
      };

      return {
        create: async ({
          model,
          data,
          select,
        }: {
          model: string;
          data: Record<string, any>;
          select?: string[];
        }) => {
          try {
            // Filter out undefined and null values, especially for id field
            // This allows database to auto-generate UUID for id column
            const cleanedData = Object.fromEntries(
              Object.entries(data).filter(([key, value]) => {
                // Remove undefined values and null id values to let database auto-generate
                if (value === undefined) return false;
                if (key === "id" && (value === null || value === undefined))
                  return false;
                return true;
              }),
            );

            const fields = Object.keys(cleanedData);
            const values = Object.values(cleanedData);
            const placeholders = fields.map(() => "?").join(", ");

            const selectClause = select ? select.join(", ") : "*";
            const query = `INSERT INTO ${model} (${fields.join(", ")})
                             VALUES (${placeholders}) RETURNING ${selectClause}`;

            // Use Bun SQL template literal syntax
            const db = getDb();
            // Convert to template literal with parameters
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`,
            );
            const result = await db
              .unsafe(parameterizedQuery, values)
              .then((rows: any) => rows[0] || null);

            return result ? transformKeys(result) : result;
          } catch (error) {
            // Debug log for create error
            throw error;
          }
        },

        update: async <T>({
          model,
          where,
          update,
        }: {
          model: string;
          where: any[];
          update: T;
        }): Promise<T | null> => {
          try {
            // Handle update object
            const updateFields = Object.keys(update as Record<string, any>);
            const updateValues = Object.values(update as Record<string, any>);

            // Handle where clause - Better Auth uses CleanedWhere[] format
            let whereClause = "";
            let whereValues: any[] = [];

            if (Array.isArray(where)) {
              const conditions = where.map((condition: any) => {
                whereValues.push(condition.value);
                return `${condition.field} = ?`;
              });
              whereClause = conditions.join(" AND ");
            } else if (where && typeof where === "object") {
              const whereFields = Object.keys(where);
              whereValues = Object.values(where);
              whereClause = whereFields
                .map((field) => `${field} = ?`)
                .join(" AND ");
            }

            const setClause = updateFields
              .map((field) => `${field} = ?`)
              .join(", ");

            const query = `UPDATE ${model}
                             SET ${setClause}
                             WHERE ${whereClause} RETURNING *`;

            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`,
            );
            const allValues = [...updateValues, ...whereValues];
            const result = await db
              .unsafe(parameterizedQuery, allValues)
              .then((rows: any) => rows[0] || null);

            return result ? (transformKeys(result) as T) : null;
          } catch (error) {
            // Debug log for update error
            throw error;
          }
        },

        updateMany: async ({
          model,
          where,
          update,
        }: {
          model: string;
          where: any[];
          update: Record<string, any>;
        }) => {
          try {
            const updateFields = Object.keys(update);
            const updateValues = Object.values(update);

            // Handle Better Auth's where format (array of condition objects)
            let whereClause = "";
            let whereValues: any[] = [];

            if (Array.isArray(where)) {
              const conditions = where.map((condition: any) => {
                whereValues.push(condition.value);
                return `${condition.field} = ?`;
              });
              whereClause = conditions.join(" AND ");
            } else if (where && typeof where === "object") {
              // Fallback for object format
              const whereFields = Object.keys(where);
              whereValues = Object.values(where);
              whereClause = whereFields
                .map((field) => `${field} = ?`)
                .join(" AND ");
            }

            const setClause = updateFields
              .map((field) => `${field} = ?`)
              .join(", ");

            const query = `UPDATE ${model}
                             SET ${setClause}
                             WHERE ${whereClause}`;
            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`,
            );
            const allValues = [...updateValues, ...whereValues];
            const result = await db.unsafe(parameterizedQuery, allValues);

            return (result as any).changes || 0;
          } catch (error) {
            // Debug log for updateMany error
            throw error;
          }
        },

        delete: async ({ model, where }: { model: string; where: any[] }) => {
          try {
            // Handle Better Auth's where format (array of condition objects)
            let whereClause = "";
            let whereValues: any[] = [];

            if (Array.isArray(where)) {
              const conditions = where.map((condition: any) => {
                whereValues.push(condition.value);
                return `${condition.field} = ?`;
              });
              whereClause = conditions.join(" AND ");
            } else if (where && typeof where === "object") {
              // Fallback for object format
              const whereFields = Object.keys(where);
              whereValues = Object.values(where);
              whereClause = whereFields
                .map((field) => `${field} = ?`)
                .join(" AND ");
            }

            const query = `DELETE FROM ${model} WHERE ${whereClause}`;
            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`,
            );
            await db.unsafe(parameterizedQuery, whereValues);
          } catch (error) {
            // Debug log for delete error
            throw error;
          }
        },

        deleteMany: async ({
          model,
          where,
        }: {
          model: string;
          where: any[];
        }) => {
          try {
            // Handle Better Auth's where format (array of condition objects)
            let whereClause = "";
            let whereValues: any[] = [];

            if (Array.isArray(where)) {
              const conditions = where.map((condition: any) => {
                whereValues.push(condition.value);
                return `${condition.field} = ?`;
              });
              whereClause = conditions.join(" AND ");
            } else if (where && typeof where === "object") {
              // Fallback for object format
              const whereFields = Object.keys(where);
              whereValues = Object.values(where);
              whereClause = whereFields
                .map((field) => `${field} = ?`)
                .join(" AND ");
            }

            const query = `DELETE FROM ${model} WHERE ${whereClause}`;
            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`,
            );
            const result = await db.unsafe(parameterizedQuery, whereValues);

            return (result as any).changes || 0;
          } catch (error) {
            // Debug log for deleteMany error
            throw error;
          }
        },

        findOne: async ({
          model,
          where,
          select,
        }: {
          model: string;
          where: any[];
          select?: string[];
        }) => {
          try {
            // Better Auth passes where as array of condition objects
            let whereClause = "";
            let whereValues: any[] = [];

            if (Array.isArray(where)) {
              const conditions = where.map((condition: any) => {
                whereValues.push(condition.value);
                return `${condition.field} = ?`;
              });
              whereClause = conditions.join(" AND ");
            } else if (where && typeof where === "object") {
              // Fallback for object format
              const whereFields = Object.keys(where);
              whereValues = Object.values(where);
              whereClause = whereFields
                .map((field) => `${field} = ?`)
                .join(" AND ");
            }

            const selectClause = select ? select.join(", ") : "*";
            const query = `SELECT ${selectClause} FROM ${model} WHERE ${whereClause} LIMIT 1`;

            // Use Bun SQL with template literal
            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`,
            );
            const result = await db
              .unsafe(parameterizedQuery, whereValues)
              .then((rows: any) => rows[0] || null);

            return result ? transformKeys(result) : null;
          } catch (error) {
            // Debug log for findOne error
            throw error;
          }
        },

        findMany: async ({
          model,
          where,
          limit,
          sortBy,
          offset,
          select,
        }: {
          model: string;
          where?: any[];
          limit?: number;
          sortBy?: { field: string; direction: "asc" | "desc" };
          offset?: number;
          select?: string[];
        }) => {
          try {
            const selectClause = select ? select.join(", ") : "*";
            let query = `SELECT ${selectClause} FROM ${model}`;
            const values: any[] = [];

            // Handle WHERE clause - Better Auth passes where as array of condition objects
            if (where && Array.isArray(where)) {
              const conditions = where.map((condition: any) => {
                values.push(condition.value);
                return `${condition.field} = ?`;
              });
              const whereClause = conditions.join(" AND ");
              query += ` WHERE ${whereClause}`;
            } else if (
              where &&
              typeof where === "object" &&
              Object.keys(where).length > 0
            ) {
              // Fallback for object format
              const whereFields = Object.keys(where);
              const whereValues = Object.values(where);
              const whereClause = whereFields
                .map((field) => `${field} = ?`)
                .join(" AND ");
              query += ` WHERE ${whereClause}`;
              values.push(...whereValues);
            }

            // Handle ORDER BY
            if (sortBy) {
              query += ` ORDER BY ${
                sortBy.field
              } ${sortBy.direction.toUpperCase()}`;
            }

            // Handle LIMIT and OFFSET
            if (limit) {
              query += ` LIMIT ${limit}`;
            }

            if (offset) {
              query += ` OFFSET ${offset}`;
            }

            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`,
            );
            const result = await db.unsafe(parameterizedQuery, values);

            const transformedResult = Array.isArray(result)
              ? result.map(transformKeys)
              : [];
            return transformedResult;
          } catch (error) {
            // Debug log for findMany error
            throw error;
          }
        },

        count: async ({ model, where }: { model: string; where?: any[] }) => {
          try {
            let query = `SELECT COUNT(*) as count FROM ${model}`;
            let whereValues: any[] = [];

            if (where) {
              if (Array.isArray(where)) {
                // Handle Better Auth's where format (array of condition objects)
                const conditions = where.map((condition: any) => {
                  whereValues.push(condition.value);
                  return `${condition.field} = ?`;
                });
                const whereClause = conditions.join(" AND ");
                query += ` WHERE ${whereClause}`;
              } else if (
                typeof where === "object" &&
                Object.keys(where).length > 0
              ) {
                // Fallback for object format
                const whereFields = Object.keys(where);
                whereValues = Object.values(where);
                const whereClause = whereFields
                  .map((field) => `${field} = ?`)
                  .join(" AND ");
                query += ` WHERE ${whereClause}`;
              }
            }

            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`,
            );
            const result = await db.unsafe(parameterizedQuery, whereValues);

            const count = parseInt(result[0]?.count || "0");
            return count;
          } catch (error) {
            // Debug log for count error
            throw error;
          }
        },

        createSchema: async (props: { tables: any; file?: string }) => {
          return {
            code: "",
            schema: "",
            path: props.file || "schema.sql",
          };
        },
      };
    },
  });
