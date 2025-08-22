import {
  createErrorResponse,
  createForbiddenResponse,
  createInternalServerErrorResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from "@farmatic/utils";

/**
 * Error types và HTTP status codes
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Business Logic
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",

  // External Services
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server Errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * Error code to HTTP status mapping
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.TOKEN_EXPIRED]: 401,

  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,

  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,

  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.details = details;

    // Maintain proper stack trace
    Error.captureStackTrace(this, AppError);
  }

  /**
   * Convert to error response format
   */
  toErrorResponse(requestId?: string): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }
}

/**
 * Error handler function to be used with onError
 * This function processes error data and returns appropriate response
 */
export function handleError(context: any) {
  const { error, set, code, request } = context;
  // Get request ID from request
  const requestId = (request as any).requestId || "unknown";

  console.log("error", error);

  // Log error with proper type checking
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  // console.error("Error occurred:", {
  //   requestId,
  //   error: errorMessage,
  //   stack: errorStack,
  //   code,
  //   timestamp: new Date().toISOString(),
  // });

  // Handle AppError instances
  if (error instanceof AppError) {
    set.status = error.statusCode;
    const response = createErrorResponse(
      { code: error.code, details: error.details || {} },
      error.message,
      error.statusCode
    );
    // Add request ID to the error details
    if (response.error) {
      response.error.details = {
        ...(typeof response.error.details === "object"
          ? response.error.details
          : {}),
        requestId,
        timestamp: new Date().toISOString(),
      };
    }
    return response;
  }

  // Handle validation errors từ Elysia
  if (code === "VALIDATION") {
    set.status = 422;

    // Extract validation errors from Elysia error object
    let validationDetails: Array<{ field: string; message: string }> = [];

    if ((error as any).all) {
      // Format Elysia validation errors to our API format
      validationDetails = (error as any).all.map((err: any) => ({
        field: err.path || err.property || "unknown",
        message: err.message || err.summary || "Validation failed",
      }));
    } else if ((error as any).validator && (error as any).value) {
      // Handle single validation error
      const errorProperty = (error as any).property || "/unknown";
      const fieldName = errorProperty.startsWith("/")
        ? errorProperty.substring(1)
        : errorProperty;
      validationDetails = [
        {
          field: fieldName,
          message: (error as any).message || "Validation failed",
        },
      ];
    }

    const response = createValidationErrorResponse(
      validationDetails,
      "Validation failed"
    );

    // Add request ID and timestamp to validation error response
    if (
      response.error &&
      typeof response.error.details === "object" &&
      Array.isArray(response.error.details)
    ) {
      // Create new details object that includes both validation errors and metadata
      response.error.details = {
        validationErrors: response.error.details,
        requestId,
        timestamp: new Date().toISOString(),
      };
    } else if (response.error) {
      response.error.details = {
        validationErrors: validationDetails,
        requestId,
        timestamp: new Date().toISOString(),
      };
    }

    return response;
  }

  // Handle 404 errors
  if (
    errorMessage.includes("Endpoint not found") ||
    errorMessage.includes("not found")
  ) {
    set.status = 404;
    const response = createErrorResponse(
      {
        code: "NOT_FOUND",
        details: { requestId, timestamp: new Date().toISOString() },
      },
      "Endpoint not found",
      404
    );
    return response;
  }

  // Handle authentication/authorization errors
  if (
    errorMessage.includes("Authentication required") ||
    errorMessage.includes("Authentication failed")
  ) {
    set.status = 401;
    const response = createUnauthorizedResponse(errorMessage);
    // Add request ID to auth error
    if (response.error) {
      response.error.details = {
        requestId,
        timestamp: new Date().toISOString(),
      };
    }
    return response;
  }

  if (
    errorMessage.includes("Access denied") ||
    errorMessage.includes("Permission denied")
  ) {
    set.status = 403;
    const response = createForbiddenResponse(errorMessage);
    // Add request ID to forbidden error
    if (response.error) {
      response.error.details = {
        requestId,
        timestamp: new Date().toISOString(),
      };
    }
    return response;
  }

  if (errorMessage.includes("Rate limit exceeded")) {
    set.status = 429;
    return createErrorResponse(
      {
        code: "RATE_LIMIT_EXCEEDED",
        details: { requestId, timestamp: new Date().toISOString() },
      },
      errorMessage,
      429
    );
  }

  // Handle database errors
  if (
    errorMessage.includes("database") ||
    errorMessage.includes("connection") ||
    (error as any).code === "ECONNREFUSED"
  ) {
    set.status = 500;
    return createErrorResponse(
      {
        code: "DATABASE_ERROR",
        details: { requestId, timestamp: new Date().toISOString() },
      },
      "Database operation failed",
      500
    );
  }

  // Default to internal server error
  set.status = 500;
  const response = createInternalServerErrorResponse(
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : errorMessage
  );
  // Add request ID to internal server error
  if (response.error) {
    response.error.details = { requestId, timestamp: new Date().toISOString() };
  }
  return response;
}
