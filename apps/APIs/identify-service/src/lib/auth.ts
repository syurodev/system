import { betterAuth } from "better-auth";
import { bunSQLAdapter } from "./bun-sql-adapter";
import { ENV } from "../configs/env";

export const auth = betterAuth({
  database: bunSQLAdapter({
    usePlural: true, // Our schema uses plural table names (users, sessions, etc.)
    debugLogs: process.env.NODE_ENV === "development",
  }),

  // Map table names to match our existing schema
  user: {
    modelName: "users",
    fields: {
      // Map Better Auth fields to our schema fields
      email: "email",
      name: "name", 
      image: "image",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      // Add our custom fields from the schema
      username: {
        type: "string",
        required: false,
      },
      display_username: {
        type: "string",
        required: false,
      },
      metadata: {
        type: "string",
        required: false,
        defaultValue: "{}",
      },
    },
  },

  session: {
    modelName: "sessions",
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      token: "token",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
      providerId: "provider_id",
      accountId: "account_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  verification: {
    modelName: "verifications",
    fields: {
      identifier: "identifier",
      value: "value",
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  // Enable email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true if you want email verification
  },

  // Enable social providers if needed
  socialProviders: {
    // Example: GitHub
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // },
  },

  // Security settings
  advanced: {
    generateId: () => crypto.randomUUID(), // Use UUID for IDs
    crossSubDomainCookies: {
      enabled: false, // Set to true if using subdomains
    },
  },

  // Base URL for the auth service
  baseURL: ENV.BETTER_AUTH_URL,
  secret: ENV.BETTER_AUTH_SECRET,
});

// Export types for client
export type Auth = typeof auth;