/**
 * API Error response class with utility methods
 */

import type { APIError, APIResponse } from "..";

export class ApiErrorResponse {
  public readonly success: boolean = false;
  public readonly status_code: number;
  public readonly message?: string;
  public readonly error?: APIError;

  constructor(data: APIResponse) {
    this.status_code = data.status_code;
    this.message = data.message;
    this.error = data.error;
  }

  /**
   * Get the first error message
   */
  public getFirstErrorMessage(): string {
    if (this.message) return this.message;
    if (this.error?.details) {
      if (Array.isArray(this.error.details)) {
        const firstError = this.error.details[0] as any;
        return firstError?.message || "Unknown error";
      }
      if (typeof this.error.details === "string") {
        return this.error.details;
      }
    }
    return "An error occurred";
  }

  /**
   * Get all error messages as an array
   */
  public getAllErrorMessages(): string[] {
    const messages: string[] = [];

    if (this.message) messages.push(this.message);

    if (this.error?.details) {
      if (Array.isArray(this.error.details)) {
        this.error.details.forEach((error: any) => {
          if (error.message) messages.push(error.message);
        });
      } else if (typeof this.error.details === "string") {
        messages.push(this.error.details);
      }
    }

    return Array.from(new Set(messages));
  }

  /**
   * Get errors for a specific field
   */
  public getFieldErrors(field: string): string[] {
    if (!this.error?.details || !Array.isArray(this.error.details)) return [];

    return this.error.details
      .filter((error: any) => error.field === field)
      .map((error: any) => error.message);
  }

  /**
   * Check if error is validation error
   */
  public isValidationError(): boolean {
    return this.error?.code === "VALIDATION_ERROR" || this.status_code === 400;
  }

  /**
   * Check if error is authentication error
   */
  public isAuthError(): boolean {
    return this.status_code === 401 || this.status_code === 403;
  }

  /**
   * Check if an error is not found
   */
  public isNotFoundError(): boolean {
    return this.status_code === 404;
  }

  /**
   * Check if error is server error
   */
  public isServerError(): boolean {
    return this.status_code >= 500;
  }

  /**
   * Get user-friendly error message
   */
  public getUserFriendlyMessage(): string {
    if (this.isAuthError()) {
      return "Authentication failed. Please log in again.";
    }

    if (this.isNotFoundError()) {
      return "The requested resource was not found.";
    }

    if (this.isServerError()) {
      return "Server error. Please try again later.";
    }

    return this.getFirstErrorMessage();
  }
}
