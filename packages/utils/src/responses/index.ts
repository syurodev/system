/**
 * Standard API response utilities for dashboard-be services
 */

export interface APIError {
  code: string;
  details?: unknown;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  status_code: number;
  message?: string;
  metadata?: T;
  error?: APIError;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponseMetadata<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Create successful API response
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  message?: string,
  statusCode: number = 200
): APIResponse<T> {
  return {
    success: true,
    status_code: statusCode,
    message,
    metadata: data,
  };
}

/**
 * Create error API response
 */
export function createErrorResponse(
  error: APIError,
  message?: string,
  statusCode: number = 400
): APIResponse {
  return {
    success: false,
    status_code: statusCode,
    message,
    error,
  };
}

/**
 * Create paginated API response
 */
export function createPaginatedResponse<T = unknown>(
  items: T[],
  pagination: PaginationMeta,
  message?: string,
  statusCode: number = 200
): APIResponse<PaginatedResponseMetadata<T>> {
  return {
    success: true,
    status_code: statusCode,
    message,
    metadata: {
      items,
      pagination,
    },
  };
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  validationErrors: Array<{ field: string; message: string }>,
  message: string = "Validation failed"
): APIResponse {
  return {
    success: false,
    status_code: 422,
    message,
    error: {
      code: "VALIDATION_ERROR",
      details: validationErrors,
    },
  };
}

/**
 * Create not found error response
 */
export function createNotFoundResponse(
  resource: string = "Resource"
): APIResponse {
  return {
    success: false,
    status_code: 404,
    message: `${resource} not found`,
    error: {
      code: "NOT_FOUND",
    },
  };
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedResponse(
  message: string = "Unauthorized access"
): APIResponse {
  return {
    success: false,
    status_code: 401,
    message,
    error: {
      code: "UNAUTHORIZED",
    },
  };
}

/**
 * Create forbidden error response
 */
export function createForbiddenResponse(
  message: string = "Access forbidden"
): APIResponse {
  return {
    success: false,
    status_code: 403,
    message,
    error: {
      code: "FORBIDDEN",
    },
  };
}

/**
 * Create internal server error response
 */
export function createInternalServerErrorResponse(
  message: string = "Internal server error"
): APIResponse {
  return {
    success: false,
    status_code: 500,
    message,
    error: {
      code: "INTERNAL_SERVER_ERROR",
    },
  };
}

export * from "./models";
