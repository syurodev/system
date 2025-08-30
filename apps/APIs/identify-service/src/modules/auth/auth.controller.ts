import { Elysia, t } from "elysia";
import { auth } from "../../lib/auth";

/**
 * Auth controller với Better Auth integration
 */
export const authRoutes = new Elysia({
  prefix: "/auth",
  tags: ["Authentication"],
})
  // Get current session
  .get(
    "/session",
    async ({ session, user }) => {
      if (!session || !user) {
        return {
          success: false,
          data: null,
          message: "No active session",
        };
      }

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            display_username: user.display_username,
            image: user.image,
            createdAt: user.createdAt,
          },
          session: {
            id: session.id,
            expiresAt: session.expiresAt,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
          },
        },
        message: "Session retrieved successfully",
      };
    },
    {
      detail: {
        summary: "Get Current Session",
        description: "Retrieve current user session and user information",
      },
    }
  )

  // Sign up with email
  .post(
    "/signup",
    async ({ body, set }) => {
      try {
        const result = await auth.api.signUpEmail({
          body: {
            email: body.email,
            password: body.password,
            name: body.name,
            username: body.username,
          },
        });

        if (result.error) {
          set.status = 400;
          return {
            success: false,
            error: result.error.message,
            message: "Sign up failed",
          };
        }

        return {
          success: true,
          data: {
            user: result.data.user,
            session: result.data.session,
          },
          message: "User created successfully",
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Sign up failed",
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        name: t.String({ minLength: 1 }),
        username: t.Optional(t.String({ minLength: 3 })),
      }),
      detail: {
        summary: "Sign Up with Email",
        description: "Create a new user account with email and password",
      },
    }
  )

  // Sign in with email
  .post(
    "/signin",
    async ({ body, set }) => {
      try {
        const result = await auth.api.signInEmail({
          body: {
            email: body.email,
            password: body.password,
          },
        });

        if (result.error) {
          set.status = 401;
          return {
            success: false,
            error: result.error.message,
            message: "Sign in failed",
          };
        }

        return {
          success: true,
          data: {
            user: result.data.user,
            session: result.data.session,
          },
          message: "Signed in successfully",
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Sign in failed",
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: "Sign In with Email",
        description: "Sign in with email and password",
      },
    }
  )

  // Sign out
  .post(
    "/signout",
    async ({ headers, set }) => {
      try {
        const result = await auth.api.signOut({
          headers,
        });

        if (result.error) {
          set.status = 400;
          return {
            success: false,
            error: result.error.message,
            message: "Sign out failed",
          };
        }

        return {
          success: true,
          data: null,
          message: "Signed out successfully",
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Sign out failed",
        };
      }
    },
    {
      detail: {
        summary: "Sign Out",
        description: "Sign out current user session",
      },
    }
  )

  // Change password
  .post(
    "/change-password",
    async ({ body, headers, session, set }) => {
      if (!session) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          message: "Please sign in first",
        };
      }

      try {
        const result = await auth.api.changePassword({
          body: {
            newPassword: body.newPassword,
            currentPassword: body.currentPassword,
          },
          headers,
        });

        if (result.error) {
          set.status = 400;
          return {
            success: false,
            error: result.error.message,
            message: "Password change failed",
          };
        }

        return {
          success: true,
          data: null,
          message: "Password changed successfully",
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Password change failed",
        };
      }
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: 6 }),
      }),
      detail: {
        summary: "Change Password",
        description: "Change user password (requires authentication)",
      },
    }
  )

  // Update profile
  .patch(
    "/profile",
    async ({ body, headers, session, set }) => {
      if (!session) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          message: "Please sign in first",
        };
      }

      try {
        const result = await auth.api.updateUser({
          body: {
            name: body.name,
            username: body.username,
            image: body.image,
          },
          headers,
        });

        if (result.error) {
          set.status = 400;
          return {
            success: false,
            error: result.error.message,
            message: "Profile update failed",
          };
        }

        return {
          success: true,
          data: result.data.user,
          message: "Profile updated successfully",
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Profile update failed",
        };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        username: t.Optional(t.String({ minLength: 3 })),
        image: t.Optional(t.String({ format: "uri" })),
      }),
      detail: {
        summary: "Update Profile",
        description: "Update user profile information (requires authentication)",
      },
    }
  );