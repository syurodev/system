/**
 * Generic API response class with utility methods
 */

import type { APIError, APIResponse } from "..";
import { ApiErrorResponse } from "./api-error-response";

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly status_code: number;
  public readonly message?: string;
  public readonly metadata?: T;
  public readonly error?: APIError;

  constructor(data: APIResponse<T>) {
    this.success = data.success;
    this.status_code = data.status_code;
    this.message = data.message;
    this.metadata = data.metadata;
    this.error = data.error;
  }

  /**
   * Check if response was successful
   */
  public isSuccess(): boolean {
    return this.success && this.status_code >= 200 && this.status_code < 300;
  }

  /**
   * Get metadata with fallback
   */
  public getMetadata<K = T>(fallback: K): T | K {
    return this.metadata ?? fallback;
  }

  /**
   * Get metadata or throw error
   */
  public getMetadataOrThrow(): T {
    if (!this.isSuccess() || this.metadata === undefined) {
      throw new Error(this.message || "API request failed");
    }
    return this.metadata;
  }

  /**
   * Get error response if failed
   */
  public getError(): ApiErrorResponse | null {
    if (this.isSuccess()) return null;
    return new ApiErrorResponse(this);
  }
}
