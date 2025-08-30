import { BaseRepository, Transaction } from "@repo/elysia";
import type { AccountEntity } from "../entities/account.entity";

/**
 * Account Repository
 * 
 * Manages external authentication provider accounts for Better Auth integration.
 * Handles OAuth provider connections, token management, and provider-specific data.
 * 
 * @example
 * ```typescript
 * const accountRepo = new AccountRepository();
 * 
 * // Create a new provider account
 * const account = await accountRepo.createAccount({
 *   user_id: "user-123",
 *   provider_id: "github",
 *   account_id: "github-user-id",
 *   access_token: "oauth-access-token",
 *   refresh_token: "oauth-refresh-token"
 * });
 * 
 * // Find account by provider
 * const account = await accountRepo.findByProvider("user-123", "github");
 * 
 * // Update access token
 * await accountRepo.updateTokens(account.id, {
 *   access_token: "new-access-token",
 *   access_token_expires_at: new Date(Date.now() + 3600000)
 * });
 * ```
 */
export class AccountRepository extends BaseRepository<AccountEntity> {
  constructor() {
    super("accounts");
  }

  /**
   * Map database row to AccountEntity
   * @param row - Raw database row
   * @returns AccountEntity
   */
  protected mapToEntity(row: any): AccountEntity {
    return row as AccountEntity;
  }

  /**
   * Create a new provider account
   * @param accountData - Account creation data
   * @returns Promise<AccountEntity | null>
   */
  async createAccount(
    accountData: {
      user_id: string;
      provider_id: string;
      account_id: string;
      access_token?: string;
      refresh_token?: string;
      access_token_expires_at?: Date;
      refresh_token_expires_at?: Date;
      scope?: string;
      id_token?: string;
      password?: string;
    },
    tx?: Transaction,
  ): Promise<AccountEntity | null> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const [account] = await client`
        INSERT INTO accounts (
          id,
          user_id,
          provider_id,
          account_id,
          access_token,
          refresh_token,
          access_token_expires_at,
          refresh_token_expires_at,
          scope,
          id_token,
          password,
          created_at,
          updated_at
        ) VALUES (
          ${crypto.randomUUID()},
          ${accountData.user_id},
          ${accountData.provider_id},
          ${accountData.account_id},
          ${accountData.access_token || null},
          ${accountData.refresh_token || null},
          ${accountData.access_token_expires_at || null},
          ${accountData.refresh_token_expires_at || null},
          ${accountData.scope || null},
          ${accountData.id_token || null},
          ${accountData.password || null},
          ${now},
          ${now}
        ) RETURNING *
      `;

      return account as AccountEntity;
    } catch (error) {
      console.error("Error creating account:", error);
      return null;
    }
  }

  /**
   * Find account by user ID and provider
   * @param userId - User ID
   * @param providerId - Provider ID (e.g., 'github', 'google')
   * @returns Promise<AccountEntity | null>
   */
  async findByProvider(userId: string, providerId: string, tx?: Transaction): Promise<AccountEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [account] = await client`
        SELECT * FROM accounts 
        WHERE user_id = ${userId} AND provider_id = ${providerId}
        LIMIT 1
      `;

      return account as AccountEntity || null;
    } catch (error) {
      console.error("Error finding account by provider:", error);
      return null;
    }
  }

  /**
   * Find account by provider account ID
   * @param providerId - Provider ID
   * @param accountId - Account ID on the provider
   * @returns Promise<AccountEntity | null>
   */
  async findByProviderAccountId(providerId: string, accountId: string, tx?: Transaction): Promise<AccountEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [account] = await client`
        SELECT * FROM accounts 
        WHERE provider_id = ${providerId} AND account_id = ${accountId}
        LIMIT 1
      `;

      return account as AccountEntity || null;
    } catch (error) {
      console.error("Error finding account by provider account ID:", error);
      return null;
    }
  }

  /**
   * Get all accounts for a user
   * @param userId - User ID
   * @returns Promise<AccountEntity[]>
   */
  async findByUserId(userId: string, tx?: Transaction): Promise<AccountEntity[]> {
    try {
      const client = tx || this.sql;
      
      const accounts = await client`
        SELECT * FROM accounts 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return accounts as AccountEntity[];
    } catch (error) {
      console.error("Error finding accounts by user ID:", error);
      return [];
    }
  }

  /**
   * Update account tokens
   * @param accountId - Account ID
   * @param tokenData - Token update data
   * @returns Promise<AccountEntity | null>
   */
  async updateTokens(accountId: string, tokenData: {
    access_token?: string;
    refresh_token?: string;
    access_token_expires_at?: Date;
    refresh_token_expires_at?: Date;
    scope?: string;
    id_token?: string;
  }, tx?: Transaction): Promise<AccountEntity | null> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const setParts: string[] = ["updated_at = $" + (Object.keys(tokenData).length + 2)];
      const values: any[] = [accountId];

      if (tokenData.access_token !== undefined) {
        setParts.push("access_token = $" + (values.length + 1));
        values.push(tokenData.access_token);
      }
      if (tokenData.refresh_token !== undefined) {
        setParts.push("refresh_token = $" + (values.length + 1));
        values.push(tokenData.refresh_token);
      }
      if (tokenData.access_token_expires_at !== undefined) {
        setParts.push("access_token_expires_at = $" + (values.length + 1));
        values.push(tokenData.access_token_expires_at);
      }
      if (tokenData.refresh_token_expires_at !== undefined) {
        setParts.push("refresh_token_expires_at = $" + (values.length + 1));
        values.push(tokenData.refresh_token_expires_at);
      }
      if (tokenData.scope !== undefined) {
        setParts.push("scope = $" + (values.length + 1));
        values.push(tokenData.scope);
      }
      if (tokenData.id_token !== undefined) {
        setParts.push("id_token = $" + (values.length + 1));
        values.push(tokenData.id_token);
      }

      values.push(now);

      const [account] = await client`
        UPDATE accounts 
        SET ${setParts.join(", ")}
        WHERE id = ${accountId}
        RETURNING *
      `;

      return account as AccountEntity || null;
    } catch (error) {
      console.error("Error updating account tokens:", error);
      return null;
    }
  }

  /**
   * Update account password (for email/password accounts)
   * @param accountId - Account ID
   * @param hashedPassword - New hashed password
   * @returns Promise<AccountEntity | null>
   */
  async updatePassword(accountId: string, hashedPassword: string, tx?: Transaction): Promise<AccountEntity | null> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const [account] = await client`
        UPDATE accounts 
        SET password = ${hashedPassword}, updated_at = ${now}
        WHERE id = ${accountId}
        RETURNING *
      `;

      return account as AccountEntity || null;
    } catch (error) {
      console.error("Error updating account password:", error);
      return null;
    }
  }

  /**
   * Delete account by ID
   * @param accountId - Account ID
   * @returns Promise<boolean>
   */
  async deleteAccount(accountId: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      
      const result = await client`
        DELETE FROM accounts WHERE id = ${accountId}
      `;

      return (result as any).changes > 0;
    } catch (error) {
      console.error("Error deleting account:", error);
      return false;
    }
  }

  /**
   * Delete all accounts for a user
   * @param userId - User ID
   * @returns Promise<number> - Number of deleted accounts
   */
  async deleteAllUserAccounts(userId: string, tx?: Transaction): Promise<number> {
    try {
      const client = tx || this.sql;
      
      const result = await client`
        DELETE FROM accounts WHERE user_id = ${userId}
      `;

      return (result as any).changes || 0;
    } catch (error) {
      console.error("Error deleting user accounts:", error);
      return 0;
    }
  }

  /**
   * Find accounts with expired access tokens
   * @returns Promise<AccountEntity[]>
   */
  async findAccountsWithExpiredTokens(tx?: Transaction): Promise<AccountEntity[]> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const accounts = await client`
        SELECT * FROM accounts 
        WHERE access_token_expires_at IS NOT NULL 
        AND access_token_expires_at <= ${now}
        AND refresh_token IS NOT NULL
      `;

      return accounts as AccountEntity[];
    } catch (error) {
      console.error("Error finding accounts with expired tokens:", error);
      return [];
    }
  }

  /**
   * Check if user has account with specific provider
   * @param userId - User ID
   * @param providerId - Provider ID
   * @returns Promise<boolean>
   */
  async hasProviderAccount(userId: string, providerId: string, tx?: Transaction): Promise<boolean> {
    try {
      const client = tx || this.sql;
      
      const [result] = await client`
        SELECT 1 FROM accounts 
        WHERE user_id = ${userId} AND provider_id = ${providerId}
        LIMIT 1
      `;

      return !!result;
    } catch (error) {
      console.error("Error checking provider account:", error);
      return false;
    }
  }

  /**
   * Get user's connected providers
   * @param userId - User ID
   * @returns Promise<string[]> - List of provider IDs
   */
  async getUserProviders(userId: string, tx?: Transaction): Promise<string[]> {
    try {
      const client = tx || this.sql;
      
      const results = await client`
        SELECT DISTINCT provider_id FROM accounts 
        WHERE user_id = ${userId}
        ORDER BY provider_id
      `;

      return results.map((row: any) => row.provider_id);
    } catch (error) {
      console.error("Error getting user providers:", error);
      return [];
    }
  }

  /**
   * Find email/password account for user
   * @param userId - User ID
   * @returns Promise<AccountEntity | null>
   */
  async findEmailPasswordAccount(userId: string, tx?: Transaction): Promise<AccountEntity | null> {
    try {
      const client = tx || this.sql;
      
      const [account] = await client`
        SELECT * FROM accounts 
        WHERE user_id = ${userId} AND provider_id = 'credential'
        LIMIT 1
      `;

      return account as AccountEntity || null;
    } catch (error) {
      console.error("Error finding email/password account:", error);
      return null;
    }
  }

  /**
   * Clean up expired refresh tokens
   * @returns Promise<number> - Number of cleaned up accounts
   */
  async cleanupExpiredRefreshTokens(tx?: Transaction): Promise<number> {
    try {
      const client = tx || this.sql;
      const now = new Date();
      
      const result = await client`
        UPDATE accounts 
        SET refresh_token = NULL, 
            refresh_token_expires_at = NULL,
            updated_at = ${now}
        WHERE refresh_token_expires_at IS NOT NULL 
        AND refresh_token_expires_at <= ${now}
      `;

      const updatedCount = (result as any).changes || 0;
      if (updatedCount > 0) {
        console.log(`Cleaned up ${updatedCount} expired refresh tokens`);
      }

      return updatedCount;
    } catch (error) {
      console.error("Error cleaning up expired refresh tokens:", error);
      return 0;
    }
  }

  /**
   * Get account statistics by provider
   * @returns Promise<{provider_id: string, count: number}[]>
   */
  async getAccountStatsByProvider(tx?: Transaction): Promise<{provider_id: string, count: number}[]> {
    try {
      const client = tx || this.sql;
      
      const stats = await client`
        SELECT provider_id, COUNT(*) as count 
        FROM accounts 
        GROUP BY provider_id 
        ORDER BY count DESC
      `;

      return stats.map((row: any) => ({
        provider_id: row.provider_id,
        count: parseInt(row.count) || 0
      }));
    } catch (error) {
      console.error("Error getting account stats by provider:", error);
      return [];
    }
  }
}