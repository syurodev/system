/**
 * Validation Utilities
 *
 * Common validation functions cho business logic
 * Bổ sung cho Elysia schema validation
 */

/**
 * Email validation
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /**
   * Validate email format
   */
  static isValid(email: string): boolean {
    if (!email || email.length > 254) return false;
    return this.EMAIL_REGEX.test(email);
  }

  /**
   * Normalize email (lowercase, trim)
   */
  static normalize(email: string): string {
    return email.toLowerCase().trim();
  }
}

/**
 * Password validation
 */
export class PasswordValidator {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  /**
   * Validate password strength
   */
  static validate(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password) {
      errors.push("Password is required");
      return { isValid: false, errors };
    }

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must not exceed ${this.MAX_LENGTH} characters`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Phone number validation (Vietnam format)
 */
export class PhoneValidator {
  private static readonly VN_PHONE_REGEX =
    /^(\+84|84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;

  /**
   * Validate Vietnam phone number
   */
  static isValid(phone: string): boolean {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    return this.VN_PHONE_REGEX.test(cleaned);
  }

  /**
   * Normalize phone number to +84 format
   */
  static normalize(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");

    if (cleaned.startsWith("+84")) {
      return cleaned;
    } else if (cleaned.startsWith("84")) {
      return "+" + cleaned;
    } else if (cleaned.startsWith("0")) {
      return "+84" + cleaned.slice(1);
    }

    return cleaned;
  }
}

/**
 * UUID validation
 */
export class UUIDValidator {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * Validate UUID v4 format
   */
  static isValid(uuid: string): boolean {
    if (!uuid) return false;
    return this.UUID_REGEX.test(uuid);
  }

  /**
   * Validate array of UUIDs
   */
  static areValid(uuids: string[]): boolean {
    return uuids.every((uuid) => this.isValid(uuid));
  }
}

/**
 * Business-specific validators
 */
export class FarmValidator {
  /**
   * Validate farm name
   */
  static validateName(name: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: "Farm name is required" };
    }

    if (name.length > 255) {
      return {
        isValid: false,
        error: "Farm name must not exceed 255 characters",
      };
    }

    if (!/^[a-zA-ZÀ-ỹ0-9\s\-_\.]+$/.test(name)) {
      return { isValid: false, error: "Farm name contains invalid characters" };
    }

    return { isValid: true };
  }

  /**
   * Validate pond area (m²)
   */
  static validatePondArea(area: number): {
    isValid: boolean;
    error?: string;
  } {
    if (area <= 0) {
      return { isValid: false, error: "Pond area must be greater than 0" };
    }

    if (area > 100000) {
      // 10 hectares max
      return {
        isValid: false,
        error: "Pond area exceeds maximum limit (10 hectares)",
      };
    }

    return { isValid: true };
  }
}

/**
 * Aquaculture-specific validators
 */
export class AquacultureValidator {
  /**
   * Validate stocking density (con/m²)
   */
  static validateStockingDensity(density: number): {
    isValid: boolean;
    error?: string;
  } {
    if (density <= 0) {
      return {
        isValid: false,
        error: "Stocking density must be greater than 0",
      };
    }

    if (density > 200) {
      // 200 shrimp/m² max recommended
      return {
        isValid: false,
        error: "Stocking density exceeds recommended maximum (200/m²)",
      };
    }

    return { isValid: true };
  }

  /**
   * Validate water quality parameter
   */
  static validateWaterParameter(
    parameterType: string,
    value: number
  ): {
    isValid: boolean;
    error?: string;
  } {
    const ranges: Record<string, { min: number; max: number; unit: string }> = {
      ph: { min: 6.0, max: 9.0, unit: "pH units" },
      dissolved_oxygen: { min: 0, max: 20, unit: "mg/L" },
      salinity: { min: 0, max: 50, unit: "ppt" },
      temperature_c: { min: 0, max: 50, unit: "°C" },
      ammonia_mg_l: { min: 0, max: 10, unit: "mg/L" },
      nitrite_mg_l: { min: 0, max: 10, unit: "mg/L" },
      alkalinity_mg_l: { min: 0, max: 500, unit: "mg/L" },
    };

    const range = ranges[parameterType];
    if (!range) {
      return {
        isValid: false,
        error: `Unknown parameter type: ${parameterType}`,
      };
    }

    if (value < range.min || value > range.max) {
      return {
        isValid: false,
        error: `${parameterType} must be between ${range.min} and ${range.max} ${range.unit}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate feeding rate percentage
   */
  static validateFeedingRate(rate: number): {
    isValid: boolean;
    error?: string;
  } {
    if (rate <= 0) {
      return { isValid: false, error: "Feeding rate must be greater than 0%" };
    }

    if (rate > 15) {
      // 15% body weight max
      return {
        isValid: false,
        error: "Feeding rate exceeds maximum (15% body weight)",
      };
    }

    return { isValid: true };
  }
}

/**
 * Date validation utilities
 */
export class DateValidator {
  /**
   * Validate date is not in future
   */
  static isNotFuture(date: Date): boolean {
    return date <= new Date();
  }

  /**
   * Validate date is within reasonable range for aquaculture
   */
  static isReasonableAquacultureDate(date: Date): boolean {
    const now = new Date();
    const fiveYearsAgo = new Date(
      now.getFullYear() - 5,
      now.getMonth(),
      now.getDate()
    );
    const oneYearFromNow = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate()
    );

    return date >= fiveYearsAgo && date <= oneYearFromNow;
  }

  /**
   * Validate culture cycle duration
   */
  static validateCycleDuration(
    startDate: Date,
    endDate: Date
  ): {
    isValid: boolean;
    error?: string;
    durationDays?: number;
  } {
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (duration <= 0) {
      return { isValid: false, error: "End date must be after start date" };
    }

    if (duration > 365) {
      // Max 1 year cycle
      return { isValid: false, error: "Culture cycle cannot exceed 365 days" };
    }

    if (duration < 30) {
      // Min 30 days realistic
      return {
        isValid: false,
        error: "Culture cycle must be at least 30 days",
      };
    }

    return { isValid: true, durationDays: duration };
  }
}
