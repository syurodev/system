import { BaseRepository, Transaction } from "@repo/elysia";
import type { PasskeyEntity } from "../entities/passkey.entity";

/**
 * Passkey Repository
 * 
 * Manages WebAuthn passkeys for Better Auth integration.
 * Handles passkey registration, authentication, and device management.
 * 
 * @example
 * ```typescript
 * const passkeyRepo = new PasskeyRepository();
 * 
 * // Create a new passkey
 * const passkey = await passkeyRepo.createPasskey({
 *   user_id: "user-123",
 *   credential_id: "credential-123",
 *   public_key: "base64-public-key",
 *   name: "My iPhone",
 *   device_type: "single_device"
 * });
 * 
 * // Find passkey by credential ID
 * const passkey = await passkeyRepo.findByCredentialId("credential-123");
 * 
 * // Update counter after authentication
 * await passkeyRepo.updateCounter("passkey-id", 42);
 * ```
 */
export class PasskeyRepository extends BaseRepository<PasskeyEntity> {
  constructor() {
    super("passkeys");
  }

  /**
   * Map database row to PasskeyEntity
   * @param row - Raw database row
   * @returns PasskeyEntity
   */
  protected mapToEntity(row: any): PasskeyEntity {
    return row as PasskeyEntity;
  }

  /**
   * Create a new passkey
   * @param passkeyData - Passkey creation data
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity | null>
   */
  async createPasskey(
    passkeyData: {
      user_id: string;
      credential_id: string;
      public_key: string;
      name?: string;
      device_type?: string;
      backed_up?: boolean;
      transports?: string;
      aaguid?: string;
      counter?: number;
    },
    tx?: Transaction,
  ): Promise<PasskeyEntity | null> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const [passkey] = await client`
        INSERT INTO passkeys (
          id,
          user_id,
          credential_id,
          public_key,
          name,
          device_type,
          backed_up,
          transports,
          aaguid,
          counter,
          created_at
        ) VALUES (
          ${crypto.randomUUID()},
          ${passkeyData.user_id},
          ${passkeyData.credential_id},
          ${passkeyData.public_key},
          ${passkeyData.name || null},
          ${passkeyData.device_type || null},
          ${passkeyData.backed_up || false},
          ${passkeyData.transports || null},
          ${passkeyData.aaguid || null},
          ${passkeyData.counter || 0},
          ${now}
        ) RETURNING *
      `;

      return passkey as PasskeyEntity;
    } catch (error) {
      console.error("Error creating passkey:", error);
      return null;
    }
  }

  /**
   * Find passkey by credential ID
   * @param credentialId - WebAuthn credential ID
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity | null>
   */
  async findByCredentialId(credentialId: string, tx?: Transaction): Promise<PasskeyEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [passkey] = await client`
        SELECT * FROM passkeys 
        WHERE credential_id = ${credentialId}
        LIMIT 1
      `;

      return passkey as PasskeyEntity || null;
    } catch (error) {
      console.error("Error finding passkey by credential ID:", error);
      return null;
    }
  }

  /**
   * Find all passkeys for a user
   * @param userId - User ID
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity[]>
   */
  async findByUserId(userId: string, tx?: Transaction): Promise<PasskeyEntity[]> {
    try {
      const client = tx || this.sql;
      
      const passkeys = await client`
        SELECT * FROM passkeys 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return passkeys as PasskeyEntity[];
    } catch (error) {
      console.error("Error finding passkeys by user ID:", error);
      return [];
    }
  }

  /**
   * Update passkey counter after authentication
   * @param passkeyId - Passkey ID
   * @param counter - New counter value
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity | null>
   */
  async updateCounter(passkeyId: string, counter: number, tx?: Transaction): Promise<PasskeyEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [passkey] = await client`
        UPDATE passkeys 
        SET counter = ${counter}
        WHERE id = ${passkeyId}
        RETURNING *
      `;

      return passkey as PasskeyEntity || null;
    } catch (error) {
      console.error("Error updating passkey counter:", error);
      return null;
    }
  }

  /**
   * Update passkey name
   * @param passkeyId - Passkey ID
   * @param name - New passkey name
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity | null>
   */
  async updateName(passkeyId: string, name: string, tx?: Transaction): Promise<PasskeyEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [passkey] = await client`
        UPDATE passkeys 
        SET name = ${name}
        WHERE id = ${passkeyId}
        RETURNING *
      `;

      return passkey as PasskeyEntity || null;
    } catch (error) {
      console.error("Error updating passkey name:", error);
      return null;
    }
  }

  /**
   * Delete passkey by ID
   * @param passkeyId - Passkey ID
   * @param tx - Optional database transaction
   * @returns Promise<boolean>
   */
  async deletePasskey(passkeyId: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      
      const result = await client`
        DELETE FROM passkeys WHERE id = ${passkeyId}
      `;

      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error deleting passkey:", error);
      return false;
    }
  }

  /**
   * Delete all passkeys for a user
   * @param userId - User ID
   * @param tx - Optional database transaction
   * @returns Promise<number> - Number of deleted passkeys
   */
  async deleteAllUserPasskeys(userId: string, tx?: Transaction): Promise<number> {
    try {
      const client = tx || this.sql;
      
      const result = await client`
        DELETE FROM passkeys WHERE user_id = ${userId}
      `;

      return (result as any).changes || 0;
    } catch (error) {
      console.error("Error deleting user passkeys:", error);
      return 0;
    }
  }

  /**
   * Check if user has any passkeys
   * @param userId - User ID
   * @param tx - Optional database transaction
   * @returns Promise<boolean>
   */
  async hasPasskeys(userId: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      
      const [result] = await client`
        SELECT 1 FROM passkeys 
        WHERE user_id = ${userId}
        LIMIT 1
      `;

      return !!result;
    } catch (error) {
      console.error("Error checking user passkeys:", error);
      return false;
    }
  }

  /**
   * Get passkey count for user
   * @param userId - User ID
   * @param tx - Optional database transaction
   * @returns Promise<number>
   */
  async getPasskeyCount(userId: string, tx?: Transaction): Promise<number> {
    try {
      const client = tx || this.sql;
      
      const [result] = await client`
        SELECT COUNT(*) as count FROM passkeys 
        WHERE user_id = ${userId}
      `;

      return parseInt(result?.count) || 0;
    } catch (error) {
      console.error("Error getting passkey count:", error);
      return 0;
    }
  }

  /**
   * Find passkeys by device type
   * @param deviceType - Device type filter
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity[]>
   */
  async findByDeviceType(deviceType: string, tx?: Transaction): Promise<PasskeyEntity[]> {
    try {
      const client = tx || this.sql;
      
      const passkeys = await client`
        SELECT * FROM passkeys 
        WHERE device_type = ${deviceType}
        ORDER BY created_at DESC
      `;

      return passkeys as PasskeyEntity[];
    } catch (error) {
      console.error("Error finding passkeys by device type:", error);
      return [];
    }
  }

  /**
   * Find backed up passkeys
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity[]>
   */
  async findBackedUpPasskeys(tx?: Transaction): Promise<PasskeyEntity[]> {
    try {
      const client = tx || this.sql;
      
      const passkeys = await client`
        SELECT * FROM passkeys 
        WHERE backed_up = true
        ORDER BY created_at DESC
      `;

      return passkeys as PasskeyEntity[];
    } catch (error) {
      console.error("Error finding backed up passkeys:", error);
      return [];
    }
  }

  /**
   * Get passkey statistics by device type
   * @param tx - Optional database transaction
   * @returns Promise<{device_type: string, count: number}[]>
   */
  async getPasskeyStatsByDeviceType(tx?: Transaction): Promise<{device_type: string, count: number}[]> {
    try {
      const client = tx || this.sql;
      
      const stats = await client`
        SELECT 
          COALESCE(device_type, 'unknown') as device_type, 
          COUNT(*) as count 
        FROM passkeys 
        GROUP BY device_type 
        ORDER BY count DESC
      `;

      return stats.map((row: any) => ({
        device_type: row.device_type,
        count: parseInt(row.count) || 0
      }));
    } catch (error) {
      console.error("Error getting passkey stats by device type:", error);
      return [];
    }
  }

  /**
   * Find passkeys with high counter values (potentially frequently used)
   * @param minCounter - Minimum counter value
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity[]>
   */
  async findFrequentlyUsedPasskeys(minCounter: number = 50, tx?: Transaction): Promise<PasskeyEntity[]> {
    try {
      const client = tx || this.sql;
      
      const passkeys = await client`
        SELECT * FROM passkeys 
        WHERE counter >= ${minCounter}
        ORDER BY counter DESC, created_at DESC
      `;

      return passkeys as PasskeyEntity[];
    } catch (error) {
      console.error("Error finding frequently used passkeys:", error);
      return [];
    }
  }

  /**
   * Update passkey backup status
   * @param passkeyId - Passkey ID
   * @param backedUp - New backup status
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity | null>
   */
  async updateBackupStatus(passkeyId: string, backedUp: boolean, tx?: Transaction): Promise<PasskeyEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [passkey] = await client`
        UPDATE passkeys 
        SET backed_up = ${backedUp}
        WHERE id = ${passkeyId}
        RETURNING *
      `;

      return passkey as PasskeyEntity || null;
    } catch (error) {
      console.error("Error updating passkey backup status:", error);
      return null;
    }
  }

  /**
   * Find user's most recently created passkey
   * @param userId - User ID
   * @param tx - Optional database transaction
   * @returns Promise<PasskeyEntity | null>
   */
  async findLatestPasskeyByUserId(userId: string, tx?: Transaction): Promise<PasskeyEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [passkey] = await client`
        SELECT * FROM passkeys 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      return passkey as PasskeyEntity || null;
    } catch (error) {
      console.error("Error finding latest passkey:", error);
      return null;
    }
  }

  /**
   * Get passkey usage statistics for a user
   * @param userId - User ID
   * @param tx - Optional database transaction
   * @returns Promise<{total: number, backed_up: number, average_counter: number}>
   */
  async getPasskeyUsageStats(userId: string, tx?: Transaction): Promise<{
    total: number;
    backed_up: number;
    average_counter: number;
  }> {
    try {
      const client = tx || this.sql;
      
      const [stats] = await client`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN backed_up = true THEN 1 ELSE 0 END) as backed_up_count,
          AVG(CAST(counter AS DECIMAL)) as avg_counter
        FROM passkeys 
        WHERE user_id = ${userId}
      `;

      return {
        total: parseInt(stats.total) || 0,
        backed_up: parseInt(stats.backed_up_count) || 0,
        average_counter: parseFloat(stats.avg_counter) || 0,
      };
    } catch (error) {
      console.error("Error getting passkey usage stats:", error);
      return { total: 0, backed_up: 0, average_counter: 0 };
    }
  }
}