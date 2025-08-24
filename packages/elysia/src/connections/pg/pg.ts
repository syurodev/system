import { SQL } from "bun";

export interface PgConfig {
  url?: string;
  hostname?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  max?: number;
  idleTimeout?: number;
  maxLifetime?: number;
  connectionTimeout?: number;
}

/**
 * Database pool instance sử dụng Bun SQL
 */
export class PgDatabasePool {
  private readonly config: PgConfig;
  private sql: InstanceType<typeof SQL> | null = null;

  constructor(init: PgConfig) {
    this.config = init;
  }

  /**
   * Khởi tạo connection pool
   */
  async initialize(): Promise<void> {
    // console.log("Database pool initializing...", {
    //   hostname: this.config.hostname || "from URL",
    //   port: this.config.port || "from URL",
    //   database: this.config.database || "from URL",
    //   maxConnections: this.config.max,
    // });

    try {
      // Ensure max connections is reasonable for Better Auth
      const poolConfig = {
        ...this.config,
        max: Math.min(this.config.max || 20, 5), // Limit to max 5 connections for service
        idleTimeout: this.config.idleTimeout || 30,
        maxLifetime: this.config.maxLifetime || 3600,
        connectionTimeout: this.config.connectionTimeout || 10,
      };

      this.sql = new SQL(poolConfig);

      // Test connection
      await this.healthCheck();

      // console.log("Database pool initialized successfully with config:", {
      //   max: poolConfig.max,
      //   idleTimeout: poolConfig.idleTimeout,
      //   maxLifetime: poolConfig.maxLifetime,
      // });
    } catch (error) {
      console.error("Failed to initialize database pool:", error);
      throw error;
    }
  }

  /**
   * Lấy SQL client instance
   */
  getClient(): InstanceType<typeof SQL> {
    if (!this.sql) {
      throw new Error(
        "Database pool not initialized. Call initialize() first.",
      );
    }
    return this.sql;
  }

  /**
   * Đóng connection pool
   */
  async close(): Promise<void> {
    if (this.sql) {
      console.log("Database pool closing...");
      await this.sql.close();
      this.sql = null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.sql) {
        return false;
      }

      // Simple health check query
      const [result] = await this.sql`SELECT 1 as health`;

      // Check the current connection count and max connections
      try {
        const [connInfo] = await this.sql`
            SELECT setting                                 as max_connections,
                   (SELECT count(*) FROM pg_stat_activity) as current_connections
            FROM pg_settings
            WHERE name = 'max_connections'
        `;

        // console.log("PostgreSQL connection info:", {
        //   maxConnections: connInfo?.max_connections,
        //   currentConnections: connInfo?.current_connections,
        //   poolMax: this.config.max,
        // });
      } catch (connError) {
        console.warn("Could not fetch connection info:", connError);
      }

      return result?.health === 1;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  /**
   * Begin transaction
   */
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    if (!this.sql) {
      throw new Error("Database pool not initialized");
    }

    return await this.sql.begin(callback);
  }
}

/**
 * Global database instance (singleton)
 */
let _databaseInstance: PgDatabasePool | null = null;

/**
 * Initialize the database connection pool
 */
export async function initDatabase(config: PgConfig): Promise<PgDatabasePool> {
  if (_databaseInstance) {
    console.warn("Database already initialized, skipping...");
    return _databaseInstance;
  }

  _databaseInstance = new PgDatabasePool(config);
  await _databaseInstance.initialize();
  return _databaseInstance;
}

export async function closeDatabase(): Promise<void> {
  if (_databaseInstance) {
    await _databaseInstance.close();
  }
}

/**
 * Get the initialized database instance
 */
export function getDatabase(): PgDatabasePool {
  if (!_databaseInstance) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return _databaseInstance;
}

/**
 * Legacy export for backward compatibility - deprecated
 */
export const database = {
  getClient: () => getDatabase().getClient(),
};

// =====================================================================
// Export Entities
// =====================================================================

// =====================================================================
// Export Repository Types
// =====================================================================

// =====================================================================
// Utility Functions
// =====================================================================

/**
 * Check if a user has permission for a specific action
 */
export async function checkUserPermission(
  userRole: string,
  permission: string,
  resourceType?: string,
): Promise<boolean> {
  try {
    const sql = getDatabase().getClient();
    const [result] = await sql`
        SELECT check_user_permission(${userRole}, ${permission}, ${resourceType}) as has_permission
    `;
    return result?.has_permission === true;
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
}

/**
 * Get user role by user ID
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const sql = getDatabase().getClient();
    const [result] = await sql`
        SELECT get_user_role(${userId}) as role
    `;
    return result?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}
