// =================================================================
// ACCOUNT SERVICE - TYPESCRIPT ENUMS
// =================================================================
// This file contains TypeScript enum definitions that correspond
// to the SMALLINT enum values used in the Account Service database schema.
// These enums ensure type safety and consistency between frontend and backend.
// =================================================================

// ===============================================================
// SUBSCRIPTION MANAGEMENT ENUMS
// ===============================================================

/**
 * Subscription plan types
 * Maps to subscriptions.plan_type SMALLINT values in database
 */
export enum SubscriptionPlanType {
  FREE = 0,
  PREMIUM = 1,
  VIP = 2,
}

/**
 * Subscription status
 * Maps to subscriptions.status SMALLINT values in database
 */
export enum SubscriptionStatus {
  ACTIVE = 0,
  CANCELED = 1,
  PAST_DUE = 2,
}

// ===============================================================
// TEAM MANAGEMENT ENUMS
// ===============================================================

/**
 * Team member roles
 * Maps to team_members.role SMALLINT values in database
 */
export enum TeamMemberRole {
  OWNER = 0,
  EDITOR = 1,
  UPLOADER = 2,
}

// ===============================================================
// AUTHENTICATION PROVIDER ENUMS
// ===============================================================

/**
 * Authentication provider types
 * Maps to accounts.provider_id TEXT values in database
 */
export enum AuthProvider {
  CREDENTIALS = "credentials",
  GOOGLE = "google",
  FACEBOOK = "facebook",
  GITHUB = "github",
  DISCORD = "discord",
}

/**
 * Verification token types
 * Maps to verifications.identifier TEXT values in database
 */
export enum VerificationType {
  EMAIL_VERIFICATION = "email-verification",
  PASSWORD_RESET = "password-reset",
  TWO_FACTOR = "two-factor",
  PHONE_VERIFICATION = "phone-verification",
}

/**
 * WebAuthn device types
 * Maps to passkeys.device_type TEXT values in database
 */
export enum PasskeyDeviceType {
  PLATFORM = "platform",
  CROSS_PLATFORM = "cross-platform",
  UNKNOWN = "unknown",
}

// ===============================================================
// RBAC (ROLE-BASED ACCESS CONTROL) ENUMS
// ===============================================================

/**
 * System roles (predefined roles in the system)
 * These correspond to entries in the roles table
 */
export enum SystemRole {
  MEMBER = "Member",
  UPLOADER = "Uploader",
  MODERATOR = "Moderator",
  ADMIN = "Admin",
}

/**
 * Permission categories for organizing permissions
 * These are used as prefixes in permission names (e.g., "comment:create")
 */
export enum PermissionCategory {
  COMMENT = "comment",
  REVIEW = "review",
  CONTENT = "content",
  USER = "user",
  TEAM = "team",
  ADMIN = "admin",
  MANGA = "manga",
  NOVEL = "novel",
  ANIME = "anime",
}

/**
 * Common permission actions
 * These are used as suffixes in permission names (e.g., "comment:create")
 */
export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  DELETE_ANY = "delete_any",
  UPLOAD = "upload",
  MODERATE = "moderate",
  BAN = "ban",
  MUTE = "mute",
  ASSIGN = "assign",
  ACCESS = "access",
  MANAGE = "manage",
}

// ===============================================================
// USER ACCOUNT STATUS ENUMS
// ===============================================================

/**
 * User account status (not stored in DB but used in business logic)
 */
export enum UserAccountStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  BANNED = "banned",
  PENDING_VERIFICATION = "pending_verification",
  DEACTIVATED = "deactivated",
}

/**
 * User notification preferences
 */
export enum NotificationPreference {
  ALL = "all",
  IMPORTANT_ONLY = "important_only",
  NONE = "none",
}

// ===============================================================
// UTILITY TYPES & CONSTANTS
// ===============================================================

/**
 * Common permission names used throughout the system
 * Format: {category}:{action}[_qualifier]
 */
export const PERMISSIONS = {
  // Comment permissions
  COMMENT_CREATE: "comment:create",
  COMMENT_DELETE_OWN: "comment:delete",
  COMMENT_DELETE_ANY: "comment:delete_any",
  COMMENT_MODERATE: "comment:moderate",

  // Review permissions
  REVIEW_CREATE: "review:create",
  REVIEW_DELETE_OWN: "review:delete",
  REVIEW_DELETE_ANY: "review:delete_any",
  REVIEW_MODERATE: "review:moderate",

  // Content permissions
  MANGA_UPLOAD_CHAPTER: "manga:upload_chapter",
  NOVEL_UPLOAD_CHAPTER: "novel:upload_chapter",
  ANIME_UPLOAD_EPISODE: "anime:upload_episode",
  CONTENT_MANAGE: "content:manage",

  // User permissions
  USER_BAN: "user:ban",
  USER_MUTE: "user:mute",
  USER_MANAGE: "user:manage",

  // Team permissions
  TEAM_CREATE: "team:create",
  TEAM_MANAGE: "team:manage",
  TEAM_MEMBER_INVITE: "team:member_invite",

  // Admin permissions
  ADMIN_ACCESS_DASHBOARD: "admin:access_dashboard",
  ADMIN_MANAGE_SYSTEM: "admin:manage_system",
  ROLE_ASSIGN: "role:assign",
} as const;

// ===============================================================
// TYPE GUARDS & VALIDATION
// ===============================================================

/**
 * Type guards for enum validation
 */
export const isSubscriptionPlanType = (
  value: unknown,
): value is SubscriptionPlanType => {
  return (
    typeof value === "number" &&
    Object.values(SubscriptionPlanType).includes(value)
  );
};

export const isSubscriptionStatus = (
  value: unknown,
): value is SubscriptionStatus => {
  return (
    typeof value === "number" &&
    Object.values(SubscriptionStatus).includes(value)
  );
};

export const isTeamMemberRole = (value: unknown): value is TeamMemberRole => {
  return (
    typeof value === "number" && Object.values(TeamMemberRole).includes(value)
  );
};

export const isAuthProvider = (value: unknown): value is AuthProvider => {
  return (
    typeof value === "string" &&
    Object.values(AuthProvider).includes(value as AuthProvider)
  );
};

export const isSystemRole = (value: unknown): value is SystemRole => {
  return (
    typeof value === "string" &&
    Object.values(SystemRole).includes(value as SystemRole)
  );
};

export const isVerificationType = (
  value: unknown,
): value is VerificationType => {
  return (
    typeof value === "string" &&
    Object.values(VerificationType).includes(value as VerificationType)
  );
};

export const isUserAccountStatus = (
  value: unknown,
): value is UserAccountStatus => {
  return (
    typeof value === "string" &&
    Object.values(UserAccountStatus).includes(value as UserAccountStatus)
  );
};

// ===============================================================
// UTILITY FUNCTIONS
// ===============================================================

/**
 * Check if a user has a specific subscription plan or higher
 */
export const hasSubscriptionPlanOrHigher = (
  userPlan: SubscriptionPlanType,
  requiredPlan: SubscriptionPlanType,
): boolean => {
  return userPlan >= requiredPlan;
};

/**
 * Check if subscription is active
 */
export const isSubscriptionActive = (status: SubscriptionStatus): boolean => {
  return status === SubscriptionStatus.ACTIVE;
};

/**
 * Build permission string from category and action
 */
export const buildPermission = (
  category: PermissionCategory,
  action: PermissionAction,
  qualifier?: string,
): string => {
  const base = `${category}:${action}`;
  return qualifier ? `${base}_${qualifier}` : base;
};

// ===============================================================
// EXPORT ALL ENUMS FOR CONVENIENT IMPORTING
// ===============================================================

export // Main enums are already exported above
 {};

/**
 * Default export containing all enums for bulk import
 */
export default {
  SubscriptionPlanType,
  SubscriptionStatus,
  TeamMemberRole,
  AuthProvider,
  VerificationType,
  PasskeyDeviceType,
  SystemRole,
  PermissionCategory,
  PermissionAction,
  UserAccountStatus,
  NotificationPreference,
  PERMISSIONS,
};
