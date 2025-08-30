import { BaseRepository, Transaction } from "@repo/elysia";
import type { SessionEntity } from "../entities/session.entity";

/**
 * Session Repository
 *
 * Manages sessions for Better Auth integration.
 * Handles session creation, validation, expiration, and cleanup operations.
 *
 * @example
 * ```typescript
 * const sessionRepo = new SessionRepository();
 *
 * // Create a new session
 * const session = await sessionRepo.createSession({
 *   user_id: "user-123",
 *   token: "session-token",
 *   expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
 *   ip_address: "192.168.1.1",
 *   user_agent: "Mozilla/5.0..."
 * });
 *
 * // Find session by token
 * const session = await sessionRepo.findByToken("session-token");
 *
 * // Clean up expired sessions
 * await sessionRepo.cleanupExpiredSessions();
 * ```
 */
export class SessionRepository extends BaseRepository<SessionEntity> {
  constructor() {
    super("sessions");
  }

  /**
   * Map database row to SessionEntity
   * @param row - Raw database row
   * @returns SessionEntity
   */
  protected mapToEntity(row: any): SessionEntity {
    return row as SessionEntity;
  }

  /**
   * Create a new session
   * @param sessionData - Session creation data
   * @returns Promise<SessionEntity | null>
   */
  async createSession(
    sessionData: {
      user_id: string;
      token: string;
      expires_at: Date;
      ip_address?: string;
      user_agent?: string;
    },
    tx?: Transaction,
  ): Promise<SessionEntity | null> {
    try {
      const client = tx || this.sql;
      const now = new Date();

      const [session] = await client`
        INSERT INTO sessions (
          id,
          user_id,
          token,
          expires_at,
          ip_address,
          user_agent,
          created_at,
          updated_at
        ) VALUES (
          ${crypto.randomUUID()},
          ${sessionData.user_id},
          ${sessionData.token},
          ${sessionData.expires_at},
          ${sessionData.ip_address || null},
          ${sessionData.user_agent || null},
          ${now},
          ${now}
        ) RETURNING *
      `;

      return session as SessionEntity;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  }

  /**
   * Find session by token
   * @param token - Session token
   * @returns Promise<SessionEntity | null>
   */
  async findByToken(
    token: string,
    tx?: Transaction,
  ): Promise<SessionEntity | null> {
    try {
      const client = tx || this.sql;

      const [session] = await client`
        SELECT * FROM sessions
        WHERE token = ${token}
        AND expires_at > NOW()
        LIMIT 1
      `;

      return (session as SessionEntity) || null;
    } catch (error) {
      console.error("Error finding session by token:", error);
      return null;
    }
  }

  /**
   * Find all active sessions for a user
   * @param userId - User ID
   * @returns Promise<SessionEntity[]>
   */
  async findActiveSessionsByUserId(
    userId: string,
    tx?: Transaction,
  ): Promise<SessionEntity[]> {
    try {
      const client = tx || this.sql;

      const sessions = await client`
        SELECT * FROM sessions
        WHERE user_id = ${userId}
        AND expires_at > NOW()
        ORDER BY created_at DESC
      `;

      return sessions as SessionEntity[];
    } catch (error) {
      console.error("Error finding active sessions by user ID:", error);
      return [];
    }
  }

  /**
   * Update session with new expiration or metadata
   * @param token - Session token
   * @param updates - Session update data
   * @returns Promise<SessionEntity | null>
   */
  async updateSession(
    token: string,
    updates: {
      expires_at?: Date;
      ip_address?: string;
      user_agent?: string;
    },
    tx?: Transaction,
  ): Promise<SessionEntity | null> {
    try {
      const client = tx || this.sql;
      const now = new Date();

      const setParts: string[] = [
        "updated_at = $" + (Object.keys(updates).length + 2),
      ];
      const values: any[] = [token];

      if (updates.expires_at !== undefined) {
        setParts.push("expires_at = $" + (values.length + 1));
        values.push(updates.expires_at);
      }
      if (updates.ip_address !== undefined) {
        setParts.push("ip_address = $" + (values.length + 1));
        values.push(updates.ip_address);
      }
      if (updates.user_agent !== undefined) {
        setParts.push("user_agent = $" + (values.length + 1));
        values.push(updates.user_agent);
      }

      values.push(now);

      const [session] = await client`
        UPDATE sessions
        SET ${setParts.join(", ")}
        WHERE token = ${token}
        RETURNING *
      `;

      return (session as SessionEntity) || null;
    } catch (error) {
      console.error("Error updating session:", error);
      return null;
    }
  }

  /**
   * Delete session by token
   * @param token - Session token
   * @returns Promise<boolean>
   */
  async deleteSession(token: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;

      const result = await client`
        DELETE FROM sessions WHERE token = ${token}
      `;

      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error deleting session:", error);
      return false;
    }
  }

  /**
   * Delete all sessions for a user
   * @param userId - User ID
   * @returns Promise<number> - Number of deleted sessions
   */
  async deleteAllUserSessions(
    userId: string,
    tx?: Transaction,
  ): Promise<number> {
    try {
      const client = tx || this.sql;

      const result = await client`
        DELETE FROM sessions WHERE user_id = ${userId}
      `;

      return (result as any).changes || 0;
    } catch (error) {
      console.error("Error deleting user sessions:", error);
      return 0;
    }
  }

  /**
   * Clean up expired sessions
   * @returns Promise<number> - Number of cleaned up sessions
   */
  async cleanupExpiredSessions(tx?: Transaction): Promise<number> {
    try {
      const client = tx || this.sql;
      const now = new Date();

      const result = await client`
        DELETE FROM sessions WHERE expires_at <= ${now}
      `;

      const deletedCount = (result as any).changes || 0;
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired sessions`);
      }

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return 0;
    }
  }

  /**
   * Extend session expiration
   * @param token - Session token
   * @param additionalTime - Additional time in milliseconds
   * @returns Promise<SessionEntity | null>
   */
  async extendSession(
    token: string,
    additionalTime: number,
    tx?: Transaction,
  ): Promise<SessionEntity | null> {
    try {
      const client = tx || this.sql;
      const now = new Date();

      const [session] = await client`
        UPDATE sessions
        SET expires_at = expires_at + INTERVAL '${additionalTime} milliseconds',
            updated_at = ${now}
        WHERE token = ${token}
        AND expires_at > NOW()
        RETURNING *
      `;

      return (session as SessionEntity) || null;
    } catch (error) {
      console.error("Error extending session:", error);
      return null;
    }
  }

  /**
   * Get session statistics for a user
   * @param userId - User ID
   * @returns Promise<{total: number, active: number, expired: number}>
   */
  async getSessionStats(
    userId: string,
    tx?: Transaction,
  ): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    try {
      const client = tx || this.sql;
      const now = new Date();

      const [stats] = await client`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN expires_at > ${now} THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN expires_at <= ${now} THEN 1 ELSE 0 END) as expired
        FROM sessions
        WHERE user_id = ${userId}
      `;

      return {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        expired: parseInt(stats.expired) || 0,
      };
    } catch (error) {
      console.error("Error getting session stats:", error);
      return { total: 0, active: 0, expired: 0 };
    }
  }

  /**
   * Find sessions by IP address (for security monitoring)
   * @param ipAddress - IP address
   * @param limit - Maximum number of sessions to return
   * @returns Promise<SessionEntity[]>
   */
  async findSessionsByIpAddress(
    ipAddress: string,
    limit: number = 50,
    tx?: Transaction,
  ): Promise<SessionEntity[]> {
    try {
      const client = tx || this.sql;

      const sessions = await client`
        SELECT * FROM sessions
        WHERE ip_address = ${ipAddress}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return sessions as SessionEntity[];
    } catch (error) {
      console.error("Error finding sessions by IP address:", error);
      return [];
    }
  }

  /**
   * Check if session exists and is valid
   * @param token - Session token
   * @returns Promise<boolean>
   */
  async isSessionValid(token: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      const now = new Date();

      const [result] = await client`
        SELECT 1 FROM sessions
        WHERE token = ${token}
        AND expires_at > ${now}
        LIMIT 1
      `;

      return !!result;
    } catch (error) {
      console.error("Error checking session validity:", error);
      return false;
    }
  }

  /**
   * Get the most recent session for a user
   * @param userId - User ID
   * @returns Promise<SessionEntity | null>
   */
  async getLatestSessionByUserId(
    userId: string,
    tx?: Transaction,
  ): Promise<SessionEntity | null> {
    try {
      const client = tx || this.sql;

      const [session] = await client`
        SELECT * FROM sessions
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      return (session as SessionEntity) || null;
    } catch (error) {
      console.error("Error getting latest session:", error);
      return null;
    }
  }
}
