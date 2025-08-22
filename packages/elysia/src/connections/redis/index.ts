import { RedisClient } from "bun";

export interface RedisConfig {
  url?: string;
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
  db?: number;
  keyPrefix?: string;
  connectionTimeout?: number;
  idleTimeout?: number;
  autoReconnect?: boolean;
  maxRetries?: number;
  enableOfflineQueue?: boolean;
  enableAutoPipelining?: boolean;
  tls?: boolean;
}

/**
 * Redis client wrapper sử dụng Bun Redis
 */
export class RedisClientWrapper {
  private config: RedisConfig;
  private client: InstanceType<typeof RedisClient> | null = null;

  constructor(init?: RedisConfig) {
    if (!this.client && !init) {
      throw new Error("Redis config is required");
    }
    this.config = init!;
  }

  /**
   * Build connection URL from individual config parameters
   */
  private buildConnectionUrl(): string {
    const auth = this.config.password
      ? this.config.username
        ? `${this.config.username}:${this.config.password}@`
        : `:${this.config.password}@`
      : "";
    const protocol = this.config.tls ? "rediss" : "redis";

    return `${protocol}://${auth}${this.config.hostname}:${this.config.port}/${this.config.db || 0}`;
  }

  /**
   * Kết nối Redis
   */
  async connect(): Promise<void> {
    console.log("Redis connecting...", {
      hostname: this.config.hostname || "from URL",
      port: this.config.port || "from URL",
      db: this.config.db || 0,
      tls: this.config.tls,
    });

    try {
      const options = {
        connectionTimeout: this.config.connectionTimeout,
        idleTimeout: this.config.idleTimeout,
        autoReconnect: this.config.autoReconnect,
        maxRetries: this.config.maxRetries,
        enableOfflineQueue: this.config.enableOfflineQueue,
        enableAutoPipelining: this.config.enableAutoPipelining,
        tls: this.config.tls,
      };

      // Create a client with URL or individual config
      if (this.config.url) {
        this.client = new RedisClient(this.config.url, options);
      } else {
        // Build URL from individual parameters for Bun RedisClient
        const url = this.buildConnectionUrl();
        this.client = new RedisClient(url, options);
      }

      // Setup connection event handlers
      this.client.onconnect = () => {
        console.log("Connected to Redis server");
      };

      this.client.onclose = (error) => {
        console.error("Disconnected from Redis server:", error);
      };

      // Test connection
      await this.healthCheck();

      console.log("Redis connected successfully");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  /**
   * Lấy client instance
   */
  getClient(): InstanceType<typeof RedisClient> {
    if (!this.client) {
      throw new Error("Redis client not connected. Call connect() first.");
    }
    return this.client;
  }

  /**
   * Ngắt kết nối Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      console.log("Redis disconnecting...");
      this.client.close();
      this.client = null;
    }
  }

  /**
   * Set value với TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;

    await this.client.set(prefixedKey, value);

    if (ttlSeconds) {
      await this.client.expire(prefixedKey, ttlSeconds);
    }
  }

  /**
   * Get value
   */
  async get(key: string): Promise<string | null> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;
    return await this.client.get(prefixedKey);
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;
    await this.client.del(prefixedKey);
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;
    return await this.client.incr(prefixedKey);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;
    return await this.client.exists(prefixedKey);
  }

  /**
   * Set TTL for key
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;
    await this.client.expire(prefixedKey, seconds);
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;
    return await this.client.ttl(prefixedKey);
  }

  /**
   * Hash operations
   */
  async hmset(key: string, fields: string[]): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;
    await this.client.hmset(prefixedKey, fields);
  }

  async hmget(key: string, fields: string[]): Promise<(string | null)[]> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const prefixedKey = (this.config.keyPrefix || "") + key;
    return await this.client.hmget(prefixedKey, fields);
  }

  /**
   * Check connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Simple ping test
      await this.client.set("health_check", "ok");
      const result = await this.client.get("health_check");
      await this.client.del("health_check");

      return result === "ok";
    } catch (error) {
      console.error("Redis health check failed:", error);
      return false;
    }
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: string): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    await this.client.send("PUBLISH", [channel, message]);
  }

  /**
   * Subscribe to channel (using raw command)
   */
  async subscribe(
    channel: string,
    _callback: (message: string) => void,
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    // Note: Bun Redis client doesn't have dedicated pub/sub API yet
    // This is a placeholder implementation using raw commands
    await this.client.send("SUBSCRIBE", [channel]);
    console.log(`Subscribed to channel: ${channel}`);

    // TODO: Implement proper message handling when Bun supports it
    // For now, this is a basic implementation
  }
}

/**
 * Global Redis instance
 */
export const index = () => {
  return new RedisClientWrapper();
};
