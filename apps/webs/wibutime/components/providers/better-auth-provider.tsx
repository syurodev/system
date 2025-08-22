/**
 * Better Auth Provider
 *
 * Provider component để wrap toàn bộ Next.js app với Better Auth
 * Thay thế AuthProvider cũ
 */

"use client";

import { Toaster } from "@farmatic/ui/components/sonner";
import { ReactNode } from "react";

interface BetterAuthProviderProps {
  children: ReactNode;
}

/**
 * Better Auth Provider
 *
 * Better Auth tự động handle session management, không cần manual provider
 * Chỉ cần wrap với các UI providers cần thiết
 */
export function BetterAuthProvider({ children }: BetterAuthProviderProps) {
  return (
    <>
      {children}
      {/* Toaster cho notifications */}
      <Toaster position="top-right" expand={false} richColors closeButton />
    </>
  );
}
