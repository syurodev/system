/**
 * Better Auth Client Configuration
 *
 * Client configuration cho Better Auth với Next.js frontend
 * Thay thế hoàn toàn hệ thống session management cũ
 */

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client instance với các plugin cần thiết
 */
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3101";

console.log("Better Auth client initializing with baseURL:", baseURL);

export const authClient = createAuthClient({
  // Base URL của Elysia backend
  baseURL,

  // Note: Client plugins không có sẵn trong Better Auth v1.3.5
  // Sẽ cập nhật khi version mới hỗ trợ

  // Custom fetch options
  fetchOptions: {
    credentials: "include", // Include cookies trong requests
  },
}) as ReturnType<typeof createAuthClient>;

/**
 * Export các auth methods để sử dụng dễ dàng
 */
export const signIn = authClient.signIn as typeof authClient.signIn;
export const signUp = authClient.signUp as typeof authClient.signUp;
export const signOut = authClient.signOut as typeof authClient.signOut;
export const useSession = authClient.useSession as typeof authClient.useSession;
export const getSession = authClient.getSession as typeof authClient.getSession;

/**
 * Custom hooks và utilities
 */

/**
 * Hook để check authentication status
 */
export function useAuth() {
  const { data: session, isPending, error } = useSession();

  return {
    user: session?.user || null,
    session: session?.session || null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
  };
}

/**
 * Hook để check user permissions/roles
 */
export function useAuthPermissions() {
  const { user } = useAuth();

  return {
    // Note: Role-based permissions can be added later when RBAC is implemented
    isAdmin: false, // TODO: Implement role checking when user roles are added
    isActive: true, // Default to true for now
    hasPhone: false, // TODO: Add phone field to user schema if needed
    isEmailVerified: user?.emailVerified === true,
  };
}

/**
 * Utility functions cho authentication
 */
export const authUtils = {
  /**
   * Sign in với email/password
   */
  async signInWithEmail(email: string, password: string, rememberMe = false) {
    try {
      const result = await signIn.email({
        email,
        password,
        rememberMe,
      });

      if (result.error) {
        throw new Error(result.error.message || "Đăng nhập thất bại");
      }

      return result;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  /**
   * Sign up với email/password
   */
  async signUpWithEmail(data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  }) {
    try {
      console.log("Calling Better Auth signUp.email with:", {
        email: data.email,
        name: data.name || "User",
        hasPassword: !!data.password,
      });

      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name || "User",
        callbackURL: "/auth/verify-email",
      });

      console.log("Better Auth signup result:", result);

      if (result.error) {
        console.error("Better Auth returned error:", result.error);
        throw new Error(result.error.message || "Đăng ký thất bại");
      }

      return result;
    } catch (error) {
      console.error("Sign up error:", error);

      // Thêm thông tin chi tiết về lỗi
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      throw error;
    }
  },

  /**
   * Sign in với social provider
   */
  async signInWithProvider(provider: "github" | "google" | "discord") {
    try {
      const result = await signIn.social({
        provider,
        callbackURL: "/dashboard",
      });

      return result;
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      throw error;
    }
  },

  /**
   * Send magic link (temporarily disabled - plugin not available)
   */
  async sendMagicLink(email: string) {
    throw new Error("Magic link feature not available in current version");
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      await signOut();
      // Redirect về trang chủ sau khi đăng xuất
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(data: { name?: string; phone?: string; image?: string }) {
    try {
      // Not available in current Better Auth client version
      throw new Error(
        "Cập nhật profile chưa khả dụng trong phiên bản hiện tại"
      );
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      // Not available in current Better Auth client version
      throw new Error("Đổi mật khẩu chưa khả dụng trong phiên bản hiện tại");
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    try {
      // Not available in current Better Auth client version
      throw new Error("Quên mật khẩu chưa khả dụng trong phiên bản hiện tại");
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },

  /**
   * Enable 2FA (temporarily disabled - plugin not available)
   */
  async enableTwoFactor() {
    throw new Error("2FA feature not available in current version");
  },

  /**
   * Verify 2FA code (temporarily disabled - plugin not available)
   */
  async verifyTwoFactor(code: string) {
    throw new Error("2FA feature not available in current version");
  },

  /**
   * Create passkey (temporarily disabled - plugin not available)
   */
  async createPasskey(name?: string) {
    throw new Error("Passkey feature not available in current version");
  },
};

/**
 * Type definitions
 */
export type AuthUser = NonNullable<ReturnType<typeof useAuth>["user"]>;
export type AuthSession = NonNullable<ReturnType<typeof useAuth>["session"]>;
