import { BaseRepository, Transaction } from "@repo/elysia";
import type { VerificationEntity } from "../entities/verification.entity";

/**
 * Verification Repository
 * 
 * Manages verification tokens for Better Auth integration.
 * Handles email verification, password reset tokens, and other verification processes.
 * 
 * @example
 * ```typescript
 * const verificationRepo = new VerificationRepository();
 * 
 * // Create email verification token
 * const verification = await verificationRepo.createVerification({
 *   identifier: "user@example.com",
 *   value: "verification-token-123",
 *   expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
 * });
 * 
 * // Verify token
 * const isValid = await verificationRepo.verifyToken("user@example.com", "verification-token-123");
 * 
 * // Clean up expired tokens
 * await verificationRepo.cleanupExpiredVerifications();
 * ```
 */
export class VerificationRepository extends BaseRepository<VerificationEntity> {
  constructor() {
    super("verifications");
  }

  /**
   * Map database row to VerificationEntity
   * @param row - Raw database row
   * @returns VerificationEntity
   */
  protected mapToEntity(row: any): VerificationEntity {
    return row as VerificationEntity;
  }

  /**
   * Create a new verification token
   * @param verificationData - Verification creation data
   * @returns Promise<VerificationEntity | null>
   */
  async createVerification(
    verificationData: {
      identifier: string;
      value: string;
      expires_at: Date;
    },
    tx?: Transaction,
  ): Promise<VerificationEntity | null> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const [verification] = await client`
        INSERT INTO verifications (
          id,
          identifier,
          value,
          expires_at,
          created_at,
          updated_at
        ) VALUES (
          ${crypto.randomUUID()},
          ${verificationData.identifier},
          ${verificationData.value},
          ${verificationData.expires_at},
          ${now},
          ${now}
        ) RETURNING *
      `;

      return verification as VerificationEntity;
    } catch (error) {
      console.error("Error creating verification:", error);
      return null;
    }
  }

  /**
   * Find verification by identifier and value
   * @param identifier - Identifier (usually email)
   * @param value - Verification token/code
   * @returns Promise<VerificationEntity | null>
   */
  async findByIdentifierAndValue(identifier: string, value: string, tx?: Transaction): Promise<VerificationEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [verification] = await client`
        SELECT * FROM verifications 
        WHERE identifier = ${identifier} 
        AND value = ${value}
        AND expires_at > NOW()
        LIMIT 1
      `;

      return verification as VerificationEntity || null;
    } catch (error) {
      console.error("Error finding verification by identifier and value:", error);
      return null;
    }
  }

  /**
   * Find all verifications for an identifier
   * @param identifier - Identifier (usually email)
   * @returns Promise<VerificationEntity[]>
   */
  async findByIdentifier(identifier: string, tx?: Transaction): Promise<VerificationEntity[]> {
    try {
      const client = tx || this.sql;
      
      const verifications = await client`
        SELECT * FROM verifications 
        WHERE identifier = ${identifier}
        ORDER BY created_at DESC
      `;

      return verifications as VerificationEntity[];
    } catch (error) {
      console.error("Error finding verifications by identifier:", error);
      return [];
    }
  }

  /**
   * Verify a token and delete it if valid
   * @param identifier - Identifier (usually email)
   * @param value - Verification token/code
   * @returns Promise<boolean> - True if token is valid and consumed
   */
  async verifyAndConsumeToken(identifier: string, value: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      // First check if token exists and is valid
      const [verification] = await client`
        SELECT * FROM verifications 
        WHERE identifier = ${identifier} 
        AND value = ${value}
        AND expires_at > ${now}
        LIMIT 1
      `;

      if (!verification) {
        return false;
      }

      // Delete the token to prevent reuse
      const result = await client`
        DELETE FROM verifications 
        WHERE identifier = ${identifier} AND value = ${value}
      `;

      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error verifying and consuming token:", error);
      return false;
    }
  }

  /**
   * Check if token is valid without consuming it
   * @param identifier - Identifier (usually email)
   * @param value - Verification token/code
   * @returns Promise<boolean>
   */
  async isTokenValid(identifier: string, value: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const [result] = await client`
        SELECT 1 FROM verifications 
        WHERE identifier = ${identifier} 
        AND value = ${value}
        AND expires_at > ${now}
        LIMIT 1
      `;

      return !!result;
    } catch (error) {
      console.error("Error checking token validity:", error);
      return false;
    }
  }

  /**
   * Delete verification by identifier and value
   * @param identifier - Identifier (usually email)
   * @param value - Verification token/code
   * @returns Promise<boolean>
   */
  async deleteVerification(identifier: string, value: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      
      const result = await client`
        DELETE FROM verifications 
        WHERE identifier = ${identifier} AND value = ${value}
      `;

      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error deleting verification:", error);
      return false;
    }
  }

  /**
   * Delete all verifications for an identifier
   * @param identifier - Identifier (usually email)
   * @returns Promise<number> - Number of deleted verifications
   */
  async deleteAllVerifications(identifier: string, tx?: Transaction): Promise<number> {
    try {
      const client = tx || this.sql;
      
      const result = await client`
        DELETE FROM verifications WHERE identifier = ${identifier}
      `;

      return (result as any).changes || 0;
    } catch (error) {
      console.error("Error deleting all verifications:", error);
      return 0;
    }
  }

  /**
   * Clean up expired verifications
   * @returns Promise<number> - Number of cleaned up verifications
   */
  async cleanupExpiredVerifications(tx?: Transaction): Promise<number> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const result = await client`
        DELETE FROM verifications WHERE expires_at <= ${now}
      `;

      const deletedCount = (result as any).changes || 0;
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired verifications`);
      }

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up expired verifications:", error);
      return 0;
    }
  }

  /**
   * Create email verification token
   * @param email - User email
   * @param token - Verification token
   * @param expirationHours - Token expiration in hours (default: 24)
   * @returns Promise<VerificationEntity | null>
   */
  async createEmailVerification(
    email: string, 
    token: string, 
    expirationHours: number = 24,
    tx?: Transaction,
  ): Promise<VerificationEntity | null> {
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    
    return this.createVerification({
      identifier: email,
      value: token,
      expires_at: expiresAt
    }, tx);
  }

  /**
   * Create password reset token
   * @param email - User email
   * @param token - Reset token
   * @param expirationHours - Token expiration in hours (default: 2)
   * @returns Promise<VerificationEntity | null>
   */
  async createPasswordResetToken(
    email: string, 
    token: string, 
    expirationHours: number = 2,
    tx?: Transaction,
  ): Promise<VerificationEntity | null> {
    // First delete any existing password reset tokens for this email
    await this.deleteAllVerifications(email, tx);
    
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    
    return this.createVerification({
      identifier: email,
      value: token,
      expires_at: expiresAt
    }, tx);
  }

  /**
   * Verify email verification token
   * @param email - User email
   * @param token - Verification token
   * @returns Promise<boolean>
   */
  async verifyEmailToken(email: string, token: string, tx?: Transaction): Promise<boolean> {
    return this.verifyAndConsumeToken(email, token, tx);
  }

  /**
   * Verify password reset token
   * @param email - User email
   * @param token - Reset token
   * @returns Promise<boolean>
   */
  async verifyPasswordResetToken(email: string, token: string, tx?: Transaction): Promise<boolean> {
    return this.verifyAndConsumeToken(email, token, tx);
  }

  /**
   * Get verification statistics
   * @returns Promise<{total: number, active: number, expired: number}>
   */
  async getVerificationStats(tx?: Transaction): Promise<{
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
        FROM verifications
      `;

      return {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        expired: parseInt(stats.expired) || 0,
      };
    } catch (error) {
      console.error("Error getting verification stats:", error);
      return { total: 0, active: 0, expired: 0 };
    }
  }

  /**
   * Check if identifier has pending verifications
   * @param identifier - Identifier (usually email)
   * @returns Promise<boolean>
   */
  async hasPendingVerifications(identifier: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const [result] = await client`
        SELECT 1 FROM verifications 
        WHERE identifier = ${identifier} 
        AND expires_at > ${now}
        LIMIT 1
      `;

      return !!result;
    } catch (error) {
      console.error("Error checking pending verifications:", error);
      return false;
    }
  }

  /**
   * Get recent verification attempts for rate limiting
   * @param identifier - Identifier (usually email)
   * @param windowMinutes - Time window in minutes (default: 15)
   * @returns Promise<number> - Number of verification attempts in window
   */
  async getRecentVerificationAttempts(identifier: string, windowMinutes: number = 15, tx?: Transaction): Promise<number> {
    try {
      const client = tx || this.sql;
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
      
      const [result] = await client`
        SELECT COUNT(*) as count 
        FROM verifications 
        WHERE identifier = ${identifier} 
        AND created_at >= ${windowStart}
      `;

      return parseInt(result?.count) || 0;
    } catch (error) {
      console.error("Error getting recent verification attempts:", error);
      return 0;
    }
  }

  /**
   * Find verifications expiring soon (for cleanup or notification)
   * @param hoursAhead - Hours ahead to check (default: 1)
   * @returns Promise<VerificationEntity[]>
   */
  async findVerificationsExpiringSoon(hoursAhead: number = 1, tx?: Transaction): Promise<VerificationEntity[]> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      const futureTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
      
      const verifications = await client`
        SELECT * FROM verifications 
        WHERE expires_at > ${now} 
        AND expires_at <= ${futureTime}
        ORDER BY expires_at ASC
      `;

      return verifications as VerificationEntity[];
    } catch (error) {
      console.error("Error finding verifications expiring soon:", error);
      return [];
    }
  }
}