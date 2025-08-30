/**
 * Better Auth Custom Adapter for Bun SQL
 *
 * Adapter tùy chỉnh để tích hợp Better Auth với Bun SQL database
 * Thay thế hoàn toàn hệ thống authentication cũ
 */

import { createAdapter, CustomAdapter } from "better-auth/adapters";
import type { SQL } from "bun";

type AdapterDebugLogs =
  | boolean
  | Record<string, boolean>
  | { isRunningAdapterTests?: boolean };

interface BunSQLAdapterConfig {
  /**
   * Helps debug issues with the adapter
   */
  debugLogs?: AdapterDebugLogs;
  /**
   * If the table names in the schema are plural
   */
  usePlural?: boolean;
  /**
   * Custom table names
   */
  tableName?: Record<string, string>;
}

export const bunSQLAdapter = (
  dbGetter: () => InstanceType<typeof SQL>,
  config: BunSQLAdapterConfig = {}
) =>
  createAdapter({
    config: {
      adapterId: "bun-sql",
      adapterName: "Bun SQL Adapter",
      usePlural: config.usePlural ?? false,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: false, // Better Auth sử dụng UUID IDs
    },
    adapter: (): CustomAdapter => {
      // Cache database connection to prevent multiple instances
      let _cachedDb: InstanceType<typeof SQL> | null = null;
      const getDb = () => {
        if (!_cachedDb) {
          _cachedDb = dbGetter();
          console.log("adapter", { message: "Database connection cached" });
        }
        return _cachedDb;
      };

      // Helper function to transform database result keys to Better Auth format
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

          // Verification table mappings
          expires_at: "expiresAt",

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
          accountid: "accountId",
          providerid: "providerId",
          userid: "userId",
          accesstoken: "accessToken",
          refreshtoken: "refreshToken",
          idtoken: "idToken",
          accesstokenexpiresat: "accessTokenExpiresAt",
          refreshtokenexpiresat: "refreshTokenExpiresAt",
          createdat: "createdAt",
          updatedat: "updatedAt",
          emailverified: "emailVerified",
          fullname: "fullName",
          isactive: "isActive",
          lastloginat: "lastLoginAt",
          expiresat: "expiresAt",
          ipaddress: "ipAddress",
          useragent: "userAgent",
        };

        const transformed: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const newKey = keyMappings[key] || key;
          transformed[newKey] = value;
        }
        return transformed;
      };

      return {
        /**
         * Tạo record mới
         */
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
            console.log("📝 Better Auth create called:", {
              model,
              data,
              select,
            });
            
            // Filter out undefined and null values, especially for id field
            // This allows database to auto-generate UUID for id column
            const cleanedData = Object.fromEntries(
              Object.entries(data).filter(([key, value]) => {
                // Remove undefined values and null id values to let database auto-generate
                if (value === undefined) return false;
                if (key === 'id' && (value === null || value === undefined)) return false;
                return true;
              })
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
              () => `$${++paramIndex}`
            );
            const result = await db
              .unsafe(parameterizedQuery, values)
              .then((rows) => rows[0] || null);

            console.log("📝 Better Auth create result:", {
              model,
              originalData: data,
              cleanedData,
              success: !!result,
            });

            console.log("create", {
              model,
              query,
              originalData: data,
              cleanedData,
              result,
            });

            return result ? transformKeys(result) : result;
          } catch (error) {
            console.error("❌ Better Auth create error:", {
              model,
              data,
              error,
            });
            console.log("create", {
              model,
              data,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        },

        /**
         * Cập nhật record theo điều kiện where
         */
        update: async <T>(data: {
          model: string;
          where: any;
          update: T;
        }): Promise<T | null> => {
          try {
            const { model, where, update } = data;

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
              () => `$${++paramIndex}`
            );
            const allValues = [...updateValues, ...whereValues];
            const result = await db
              .unsafe(parameterizedQuery, allValues)
              .then((rows) => rows[0] || null);

            console.log("update", {
              model,
              query,
              where,
              update,
              result,
            });

            return result ? (transformKeys(result) as T) : null;
          } catch (error) {
            console.log("update", {
              model: data.model,
              where: data.where,
              update: data.update,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        },

        /**
         * Cập nhật nhiều records
         */
        updateMany: async ({
          model,
          where,
          update,
        }: {
          model: string;
          where: any;
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
              () => `$${++paramIndex}`
            );
            const allValues = [...updateValues, ...whereValues];
            const result = await db.unsafe(parameterizedQuery, allValues);

            console.log("updateMany", {
              model,
              query,
              where,
              update,
              affected: (result as any).changes || 0,
            });

            return (result as any).changes || 0;
          } catch (error) {
            console.log("updateMany", {
              model,
              where,
              update,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        },

        /**
         * Xóa record theo điều kiện where
         */
        delete: async ({ model, where }: { model: string; where: any }) => {
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

            const query = `DELETE
                             FROM ${model}
                             WHERE ${whereClause}`;
            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`
            );
            await db.unsafe(parameterizedQuery, whereValues);

            console.log("delete", {
              model,
              query: parameterizedQuery,
              where,
            });
          } catch (error) {
            console.log("delete", {
              model,
              where,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        },

        /**
         * Xóa nhiều records
         */
        deleteMany: async ({ model, where }: { model: string; where: any }) => {
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

            const query = `DELETE
                             FROM ${model}
                             WHERE ${whereClause}`;
            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`
            );
            const result = await db.unsafe(parameterizedQuery, whereValues);

            console.log("deleteMany", {
              model,
              query,
              where,
              affected: (result as any).changes || 0,
            });

            return (result as any).changes || 0;
          } catch (error) {
            console.log("deleteMany", {
              model,
              where,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        },

        /**
         * Count records theo điều kiện
         */
        count: async ({ model, where }: { model: string; where?: any }) => {
          try {
            console.log("🔢 Better Auth count called:", { model, where });

            let query = `SELECT COUNT(*) as count
                           FROM ${model}`;
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
              () => `$${++paramIndex}`
            );
            const result = await db.unsafe(parameterizedQuery, whereValues);

            const count = parseInt(result[0]?.count || "0");
            console.log("🔢 Better Auth count result:", {
              model,
              where,
              count,
            });

            console.log("count", {
              model,
              query,
              where,
              count,
            });

            return count;
          } catch (error) {
            console.error("❌ Better Auth count error:", {
              model,
              where,
              error,
            });
            console.log("count", {
              model,
              where,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        },

        /**
         * Tìm một record duy nhất
         */
        findOne: async ({
          model,
          where,
          select,
        }: {
          model: string;
          where: any;
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
            const query = `SELECT ${selectClause}
                             FROM ${model}
                             WHERE ${whereClause} LIMIT 1`;

            // Use Bun SQL with template literal
            const db = getDb();
            let paramIndex = 0;
            const parameterizedQuery = query.replace(
              /\?/g,
              () => `$${++paramIndex}`
            );
            const result = await db
              .unsafe(parameterizedQuery, whereValues)
              .then((rows) => rows[0] || null);

            console.log("findOne", {
              model,
              query: parameterizedQuery,
              where,
              select,
              result,
            });

            return result ? transformKeys(result) : null;
          } catch (error) {
            console.log("findOne", {
              model,
              where,
              select,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        },

        /**
         * Tìm nhiều records với pagination và sorting
         */
        findMany: async <T>({
          model,
          where,
          limit,
          sortBy,
          offset,
          select,
        }: {
          model: string;
          where?: any;
          limit: number;
          sortBy?: { field: string; direction: "asc" | "desc" };
          offset?: number;
          select?: string[];
        }): Promise<T[]> => {
          try {
            const selectClause = select ? select.join(", ") : "*";
            let query = `SELECT ${selectClause}
                           FROM ${model}`;
            const values: any[] = [];

            // Xử lý WHERE clause - Better Auth passes where as array of condition objects
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

            // Xử lý ORDER BY
            if (sortBy) {
              query += ` ORDER BY ${
                sortBy.field
              } ${sortBy.direction.toUpperCase()}`;
            }

            // Xử lý LIMIT và OFFSET
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
              () => `$${++paramIndex}`
            );
            const result = await db.unsafe(parameterizedQuery, values);

            console.log("findMany", {
              model,
              query,
              where,
              limit,
              offset,
              sortBy,
              select,
              count: Array.isArray(result) ? result.length : 0,
            });

            // Debug accounts data for login issues
            if (
              model === "accounts" &&
              Array.isArray(result) &&
              result.length > 0
            ) {
              console.log("🔐 Account data for login debug:", {
                account: result[0],
                passwordExists: !!result[0]?.password,
                providerId: result[0]?.providerid || result[0]?.providerId,
              });
            }

            const transformedResult = Array.isArray(result)
              ? result.map(transformKeys)
              : [];
            return transformedResult;
          } catch (error) {
            console.log("findMany", {
              model,
              where,
              limit,
              offset,
              sortBy,
              select,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        },

        /**
         * Tạo schema cho Better Auth CLI
         */
        createSchema: async (props: { tables: any; file?: string }) => {
          const { tables } = props;
          let sql = "";

          for (const [tableName, tableData] of Object.entries(tables)) {
            const table = tableData as any;
            sql += `-- Better Auth ${tableName} table\n`;
            sql += `CREATE TABLE IF NOT EXISTS ${tableName}
                      (  `;

            const columns: string[] = [];

            for (const [fieldName, fieldData] of Object.entries(
              table.fields || {}
            )) {
              const field = fieldData as any;
              let columnDef = `  ${fieldName}`;

              // Map Better Auth field types to PostgreSQL types
              const fieldType = Array.isArray(field.type)
                ? field.type[0]
                : field.type;
              switch (fieldType) {
                case "string":
                  columnDef += " TEXT";
                  break;
                case "number":
                  columnDef += " INTEGER";
                  break;
                case "boolean":
                  columnDef += " BOOLEAN";
                  break;
                case "date":
                  columnDef += " TIMESTAMP";
                  break;
                default:
                  columnDef += " TEXT";
              }

              if (field.required) {
                columnDef += " NOT NULL";
              }

              if (field.unique) {
                columnDef += " UNIQUE";
              }

              if (fieldName === "id") {
                columnDef += " PRIMARY KEY";
              }

              columns.push(columnDef);
            }

            // Add foreign key constraints separately
            for (const [fieldName, fieldData] of Object.entries(
              table.fields || {}
            )) {
              const field = fieldData as any;
              if (field.references) {
                columns.push(
                  `  FOREIGN KEY (${fieldName}) REFERENCES ${field.references.model}(${field.references.field}) ON DELETE CASCADE`
                );
              }
            }

            sql += columns.join(",\n");
            sql += "\n);\n\n";

            // Add indexes for common queries
            if (tableName === "user") {
              sql += `CREATE INDEX IF NOT EXISTS idx_user_email ON user (email);  `;
            } else if (tableName === "session") {
              sql += `CREATE INDEX IF NOT EXISTS idx_session_token ON session (token);  `;
              sql += `CREATE INDEX IF NOT EXISTS idx_session_user_id ON session (userId);  `;
            } else if (tableName === "account") {
              sql += `CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(userId);  `;
              sql += `CREATE INDEX IF NOT EXISTS idx_account_provider ON account(providerId, accountId);  `;
            }

            sql += "\n";
          }

          return {
            code: sql,
            schema: sql,
            path: props.file || "schema.sql",
          };
        },
      };
    },
  });

/**
 * Type helper để infer adapter type
 */
export type BunSQLAdapter = ReturnType<typeof bunSQLAdapter>;
