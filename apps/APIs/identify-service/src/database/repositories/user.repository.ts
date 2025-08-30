import { BaseRepository, Transaction } from "@repo/elysia";
import { UserEntity } from "../entities/user.entity";
import {
  SubscriptionPlanType,
  SubscriptionStatus,
  TeamMemberRole,
} from "@repo/types";

/**
 * UserRepository - Repository class for managing user data and related operations
 *
 * This repository extends BaseRepository to provide specialized methods for user management,
 * including authentication, team management, subscriptions, and RBAC operations.
 *
 * @extends BaseRepository<UserEntity>
 */
export class UserRepository extends BaseRepository<UserEntity> {
  /**
   * Constructor - Initialize UserRepository with the users table
   *
   * @description Sets up the repository to work with the 'users' table in the database.
   * Inherits all base CRUD operations from BaseRepository while adding user-specific business logic.
   */
  constructor() {
    super(UserEntity.getTableName()); // Table name for users
  }

  /**
   * mapToEntity - Convert database row to UserEntity object
   *
   * @description Maps raw database row data to a properly typed UserEntity instance.
   * Uses UserEntity.fromRow() for consistent mapping across the application.
   *
   * @param {any} row - Raw database row from PostgreSQL query
   * @returns {UserEntity} Mapped user entity with proper types
   */
  protected mapToEntity(row: any): UserEntity {
    return UserEntity.fromRow(row);
  }

  // =====================================================================
  // CORE USER LOOKUP METHODS
  // =====================================================================

  /**
   * findByEmail - Find user by email address
   *
   * @description Searches for a user by their email address. Used primarily for authentication
   * and login processes. Email lookup is case-insensitive for better user experience.
   *
   * @param {string} email - Email address to search for (case-insensitive)
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<UserEntity | null>} User entity if found, null otherwise
   *
   * @throws {Error} Database connection or query execution errors
   *
   * @example
   * ```typescript
   * // Find user for login authentication
   * const user = await userRepo.findByEmail('john@example.com');
   * if (user && user.email_verified) {
   *   // Proceed with authentication
   * }
   * ```
   */
  async findByEmail(
    email: string,
    tx?: Transaction,
  ): Promise<UserEntity | null> {
    try {
      const client = tx || this.sql;

      // Use LOWER() for case-insensitive email search
      // This matches the database index for optimal performance
      const [result] = await client`
        SELECT * FROM users
        WHERE LOWER(email) = LOWER(${email})
        AND email IS NOT NULL
        LIMIT 1
      `;

      return result ? UserEntity.fromRow(result) : null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  }

  /**
   * findByUsername - Find user by username
   *
   * @description Searches for a user by their username. Used for profile lookups,
   * public profile pages, and username availability checks.
   * Username lookup is case-insensitive.
   *
   * @param {string} username - Username to search for (case-insensitive)
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<UserEntity | null>} User entity if found, null otherwise
   *
   * @example
   * ```typescript
   * // Check if username is available during registration
   * const existingUser = await userRepo.findByUsername('johndoe');
   * if (existingUser) {
   *   throw new Error('Username already taken');
   * }
   * ```
   */
  async findByUsername(
    username: string,
    tx?: Transaction,
  ): Promise<UserEntity | null> {
    try {
      const client = tx || this.sql;

      // Use LOWER() for case-insensitive username search
      const [result] = await client`
        SELECT * FROM users
        WHERE LOWER(username) = LOWER(${username})
        AND username IS NOT NULL
        LIMIT 1
      `;

      return result ? UserEntity.fromRow(result) : null;
    } catch (error) {
      console.error("Error finding user by username:", error);
      return null;
    }
  }

  /**
   * findByUsernameOrEmail - Find user by either username or email
   *
   * @description Flexible user lookup that checks both username and email fields.
   * Useful for login systems that allow users to authenticate with either credential.
   *
   * @param {string} identifier - Username or email to search for
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<UserEntity | null>} User entity if found, null otherwise
   *
   * @example
   * ```typescript
   * // Flexible login lookup
   * const user = await userRepo.findByUsernameOrEmail('john@example.com');
   * // or
   * const user = await userRepo.findByUsernameOrEmail('johndoe');
   * ```
   */
  async findByUsernameOrEmail(
    identifier: string,
    tx?: Transaction,
  ): Promise<UserEntity | null> {
    try {
      const client = tx || this.sql;

      // Search both username and email fields with case-insensitive matching
      const [result] = await client`
        SELECT * FROM users
        WHERE (LOWER(username) = LOWER(${identifier}) AND username IS NOT NULL)
           OR (LOWER(email) = LOWER(${identifier}) AND email IS NOT NULL)
        LIMIT 1
      `;

      return result ? UserEntity.fromRow(result) : null;
    } catch (error) {
      console.error("Error finding user by username or email:", error);
      return null;
    }
  }

  /**
   * checkUsernameAndEmailAvailability - Check if username and email are available
   *
   * @description Checks both username and email availability in a single query.
   * Used during user registration to prevent duplicate accounts.
   * Returns detailed availability status for better error messages.
   *
   * @param {string} username - Username to check for availability
   * @param {string} email - Email to check for availability
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<{usernameAvailable: boolean, emailAvailable: boolean}>} Availability status
   *
   * @example
   * ```typescript
   * const availability = await userRepo.checkUsernameAndEmailAvailability('johndoe', 'john@example.com');
   * if (!availability.usernameAvailable) {
   *   throw new Error('Username already taken');
   * }
   * if (!availability.emailAvailable) {
   *   throw new Error('Email already registered');
   * }
   * ```
   */
  async checkUsernameAndEmailAvailability(
    username: string,
    email: string,
    tx?: Transaction,
  ): Promise<{ usernameAvailable: boolean; emailAvailable: boolean }> {
    try {
      const client = tx || this.sql;

      // Single query to check both username and email availability
      const results = await client`
        SELECT
          EXISTS(SELECT 1 FROM users WHERE LOWER(username) = LOWER(${username}) AND username IS NOT NULL) AS username_exists,
          EXISTS(SELECT 1 FROM users WHERE LOWER(email) = LOWER(${email}) AND email IS NOT NULL) AS email_exists
      `;

      const result = results[0];
      return {
        usernameAvailable: !result.username_exists,
        emailAvailable: !result.email_exists,
      };
    } catch (error) {
      console.error("Error checking username and email availability:", error);
      // Return conservative result (assume taken) on error
      return {
        usernameAvailable: false,
        emailAvailable: false,
      };
    }
  }

  // =====================================================================
  // SUBSCRIPTION MANAGEMENT METHODS
  // =====================================================================

  /**
   * findUsersWithSubscription - Find users with specific subscription plan
   *
   * @description Retrieves users who have a specific subscription plan type.
   * Includes subscription details and filters by subscription status.
   * Useful for feature access control and marketing campaigns.
   *
   * @param {SubscriptionPlanType} planType - Type of subscription plan to filter by
   * @param {SubscriptionStatus} [status] - Optional subscription status filter (defaults to ACTIVE)
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<Array<UserEntity & {subscription: any}>>} Users with subscription details
   *
   * @example
   * ```typescript
   * // Get all VIP users for premium feature access
   * const vipUsers = await userRepo.findUsersWithSubscription(SubscriptionPlanType.VIP);
   *
   * // Get users with canceled premium subscriptions
   * const canceledPremium = await userRepo.findUsersWithSubscription(
   *   SubscriptionPlanType.PREMIUM,
   *   SubscriptionStatus.CANCELED
   * );
   * ```
   */
  async findUsersWithSubscription(
    planType: SubscriptionPlanType,
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
    tx?: Transaction,
  ): Promise<Array<UserEntity & { subscription: any }>> {
    try {
      const client = tx || this.sql;

      // Join users with their active subscriptions
      const results = await client`
        SELECT
          u.*,
          s.id as subscription_id,
          s.plan_type,
          s.status as subscription_status,
          s.current_period_end,
          s.stripe_customer_id,
          s.stripe_subscription_id
        FROM users u
        INNER JOIN subscriptions s ON u.id = s.user_id
        WHERE s.plan_type = ${planType}
          AND s.status = ${status}
        ORDER BY u.created_at DESC
      `;

      return results.map((row: any) => {
        const user = UserEntity.fromRow(row) as UserEntity & {
          subscription: any;
        };

        // Add subscription information to the user object
        user.subscription = {
          id: row.subscription_id,
          planType: row.plan_type,
          status: row.subscription_status,
          currentPeriodEnd: row.current_period_end,
          stripeCustomerId: row.stripe_customer_id,
          stripeSubscriptionId: row.stripe_subscription_id,
        };

        return user;
      });
    } catch (error) {
      console.error("Error finding users with subscription:", error);
      return [];
    }
  }

  /**
   * getUserSubscription - Get user's current subscription details
   *
   * @description Retrieves the current active subscription for a specific user.
   * Returns null if user has no active subscription (free tier).
   *
   * @param {string} userId - User ID to get subscription for
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<any | null>} Subscription details or null if no active subscription
   *
   * @example
   * ```typescript
   * const subscription = await userRepo.getUserSubscription('user-id');
   * if (subscription?.plan_type === SubscriptionPlanType.VIP) {
   *   // Grant VIP access
   * }
   * ```
   */
  async getUserSubscription(
    userId: string,
    tx?: Transaction,
  ): Promise<any | null> {
    try {
      const client = tx || this.sql;

      const [result] = await client`
        SELECT * FROM subscriptions
        WHERE user_id = ${userId}
          AND status = ${SubscriptionStatus.ACTIVE}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      return result || null;
    } catch (error) {
      console.error("Error getting user subscription:", error);
      return null;
    }
  }

  // =====================================================================
  // TEAM MANAGEMENT METHODS
  // =====================================================================

  /**
   * findTeamMembers - Get all members of a specific team
   *
   * @description Retrieves all users who are members of a specific team,
   * including their roles within the team. Results are ordered by role hierarchy
   * (Owner first, then Editor, then Uploader).
   *
   * @param {string} teamId - Team ID to get members for
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<Array<UserEntity & {teamRole: TeamMemberRole}>>} Team members with their roles
   *
   * @example
   * ```typescript
   * const members = await userRepo.findTeamMembers('team-uuid');
   * for (const member of members) {
   *   console.log(`${member.name} is a ${TeamMemberRole[member.teamRole]}`);
   * }
   * ```
   */
  async findTeamMembers(
    teamId: string,
    tx?: Transaction,
  ): Promise<Array<UserEntity & { teamRole: TeamMemberRole }>> {
    try {
      const client = tx || this.sql;

      // Join users with team_members to get team role information
      const results = await client`
        SELECT
          u.*,
          tm.role as team_role
        FROM users u
        INNER JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = ${teamId}
        ORDER BY tm.role ASC, u.name ASC
      `;

      return results.map((row: any) => {
        const user = UserEntity.fromRow(row) as UserEntity & {
          teamRole: TeamMemberRole;
        };
        user.teamRole = row.team_role;
        return user;
      });
    } catch (error) {
      console.error("Error finding team members:", error);
      return [];
    }
  }

  /**
   * findUserTeams - Get all teams a user belongs to
   *
   * @description Retrieves all teams that a user is a member of,
   * including the user's role in each team and basic team information.
   *
   * @param {string} userId - User ID to get teams for
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<Array<any>>} Teams the user belongs to with role information
   *
   * @example
   * ```typescript
   * const userTeams = await userRepo.findUserTeams('user-uuid');
   * const ownedTeams = userTeams.filter(t => t.role === TeamMemberRole.OWNER);
   * ```
   */
  async findUserTeams(userId: string, tx?: Transaction): Promise<Array<any>> {
    try {
      const client = tx || this.sql;

      // Join team_members with teams to get team details
      const results = await client`
        SELECT
          t.*,
          tm.role as user_role
        FROM teams t
        INNER JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ${userId}
        ORDER BY tm.role ASC, t.name ASC
      `;

      return results.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        logoUrl: row.logo_url,
        description: row.description,
        ownerUserId: row.owner_user_id,
        role: row.user_role, // User's role in this team
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error("Error finding user teams:", error);
      return [];
    }
  }

  // =====================================================================
  // RBAC (ROLE-BASED ACCESS CONTROL) METHODS
  // =====================================================================

  /**
   * getUserWithRoles - Get user with all their system roles
   *
   * @description Retrieves a user along with all their assigned system roles.
   * This is essential for authorization and permission checking throughout the application.
   *
   * @param {string} userId - User ID to get roles for
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<(UserEntity & {roles: string[]}) | null>} User with roles or null if not found
   *
   * @example
   * ```typescript
   * const userWithRoles = await userRepo.getUserWithRoles('user-uuid');
   * if (userWithRoles?.roles.includes(SystemRole.ADMIN)) {
   *   // Grant admin access
   * }
   * ```
   */
  async getUserWithRoles(
    userId: string,
    tx?: Transaction,
  ): Promise<(UserEntity & { roles: string[] }) | null> {
    try {
      const client = tx || this.sql;

      // Get user and their roles in a single query using array aggregation
      const [result] = await client`
        SELECT
          u.*,
          COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') as role_names
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ${userId}
        GROUP BY u.id
      `;

      if (!result) {
        return null;
      }

      const user = UserEntity.fromRow(result) as UserEntity & {
        roles: string[];
      };
      user.roles = result.role_names || [];

      return user;
    } catch (error) {
      console.error("Error getting user with roles:", error);
      return null;
    }
  }

  /**
   * getUserPermissions - Get all permissions for a user
   *
   * @description Retrieves all permissions available to a user based on their assigned roles.
   * This method aggregates permissions from all roles assigned to the user.
   *
   * @param {string} userId - User ID to get permissions for
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<string[]>} Array of permission names
   *
   * @example
   * ```typescript
   * const permissions = await userRepo.getUserPermissions('user-uuid');
   * if (permissions.includes('comment:create')) {
   *   // Allow user to create comments
   * }
   * ```
   */
  async getUserPermissions(
    userId: string,
    tx?: Transaction,
  ): Promise<string[]> {
    try {
      const client = tx || this.sql;

      // Complex query to aggregate all permissions from user's roles
      const results = await client`
        SELECT DISTINCT p.name
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        INNER JOIN roles r ON ur.role_id = r.id
        INNER JOIN role_permissions rp ON r.id = rp.role_id
        INNER JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ${userId}
        ORDER BY p.name
      `;

      return results.map((row: any) => row.name);
    } catch (error) {
      console.error("Error getting user permissions:", error);
      return [];
    }
  }

  // =====================================================================
  // SEARCH AND ANALYTICS METHODS
  // =====================================================================

  /**
   * searchUsers - Full-text search for users
   *
   * @description Performs a full-text search across user name, username, and email fields.
   * Supports pagination and filtering options for flexible user discovery.
   *
   * @param {string} query - Search query string
   * @param {Object} [options] - Search options
   * @param {number} [options.limit] - Maximum results to return (default: 10)
   * @param {number} [options.offset] - Number of results to skip (default: 0)
   * @param {boolean} [options.emailVerifiedOnly] - Filter to verified users only (default: false)
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<UserEntity[]>} Array of matching users
   *
   * @example
   * ```typescript
   * // Search for users with "john" in name, username, or email
   * const users = await userRepo.searchUsers('john', {
   *   limit: 20,
   *   emailVerifiedOnly: true
   * });
   * ```
   */
  async searchUsers(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      emailVerifiedOnly?: boolean;
    } = {},
    tx?: Transaction,
  ): Promise<UserEntity[]> {
    try {
      const client = tx || this.sql;
      const { limit = 10, offset = 0, emailVerifiedOnly = false } = options;

      // Use ILIKE for case-insensitive partial matching
      // This allows flexible search across multiple fields
      const emailFilter = emailVerifiedOnly
        ? client`AND email_verified = true`
        : client``;

      const results = await client`
        SELECT * FROM users
        WHERE (
          name ILIKE ${"%" + query + "%"} OR
          username ILIKE ${"%" + query + "%"} OR
          email ILIKE ${"%" + query + "%"}
        )
        ${emailFilter}
        ORDER BY
          CASE
            WHEN LOWER(username) = LOWER(${query}) THEN 1
            WHEN LOWER(name) = LOWER(${query}) THEN 2
            WHEN LOWER(email) = LOWER(${query}) THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return UserEntity.fromRows<UserEntity>(results);
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  }

  /**
   * findActiveUsers - Find users who have been active recently
   *
   * @description Retrieves users who have been active within a specified number of days.
   * Useful for analytics and user engagement tracking.
   *
   * @param {number} [days] - Number of days to look back (default: 30)
   * @param {number} [limit] - Maximum results to return (default: 100)
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<UserEntity[]>} Array of recently active users
   *
   * @example
   * ```typescript
   * // Get users active in the last 7 days
   * const activeUsers = await userRepo.findActiveUsers(7, 50);
   *
   * // Get users active in the last month (default)
   * const monthlyActive = await userRepo.findActiveUsers();
   * ```
   */
  async findActiveUsers(
    days: number = 30,
    limit: number = 100,
    tx?: Transaction,
  ): Promise<UserEntity[]> {
    try {
      const client = tx || this.sql;

      // Calculate the date threshold for "active" users
      const results = await client`
        SELECT * FROM users
        WHERE updated_at >= NOW() - INTERVAL '${days} days'
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;

      return UserEntity.fromRows<UserEntity>(results);
    } catch (error) {
      console.error("Error finding active users:", error);
      return [];
    }
  }

  /**
   * getUserStats - Get comprehensive statistics for a user
   *
   * @description Retrieves various statistics and metadata for a user,
   * including team memberships, subscription status, and activity metrics.
   *
   * @param {string} userId - User ID to get statistics for
   * @param {Transaction} [tx] - Optional database transaction for consistency
   * @returns {Promise<any>} Object containing user statistics
   *
   * @example
   * ```typescript
   * const stats = await userRepo.getUserStats('user-uuid');
   * console.log(`User has ${stats.teamCount} teams and ${stats.permissions.length} permissions`);
   * ```
   */
  async getUserStats(userId: string, tx?: Transaction): Promise<any> {
    try {
      const client = tx || this.sql;

      // Single complex query to get all user statistics
      const [result] = await client`
        SELECT
          u.*,
          s.plan_type as subscription_plan,
          s.status as subscription_status,
          (SELECT COUNT(*) FROM team_members tm WHERE tm.user_id = u.id) as team_count,
          (SELECT COUNT(*) FROM team_members tm WHERE tm.user_id = u.id AND tm.role = 0) as owned_teams_count,
          COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') as role_names
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 0
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ${userId}
        GROUP BY u.id, s.plan_type, s.status
      `;

      if (!result) {
        return null;
      }

      return {
        user: UserEntity.fromRow(result),
        subscription: {
          planType: result.subscription_plan,
          status: result.subscription_status,
        },
        teamCount: parseInt(result.team_count || "0"),
        ownedTeamsCount: parseInt(result.owned_teams_count || "0"),
        roles: result.role_names || [],
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return null;
    }
  }
}
