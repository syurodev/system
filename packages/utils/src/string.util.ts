import slug from "slug";

/**
 * String Utility Functions
 *
 * Common string manipulation functions for Vietnamese language support
 * and phone number formatting
 */

/**
 * Remove Vietnamese diacritics/accents from string
 * Converts Vietnamese characters to their ASCII equivalents
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return str;

  // Using Unicode normalization to remove diacritics
  return str
    .normalize("NFD") // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks
    .replace(/đ/g, "d") // Handle Vietnamese đ
    .replace(/Đ/g, "D"); // Handle Vietnamese Đ
}

export function normalizeString(str: string): string {
  if (!str) return str;

  return slug(str, " ");
}

/**
 * Convert phone number starting with 84 to 0 format
 * Example: "84987654321" -> "0987654321"
 */
export function convertInternationalToLocal(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== "string") return phoneNumber;

  // Remove all non-digit characters
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Check if starts with 84 (Vietnam country code)
  if (cleanPhone.startsWith("84") && cleanPhone.length >= 11) {
    return "0" + cleanPhone.substring(2);
  }

  return phoneNumber;
}

/**
 * Convert phone number starting with 0 to 84 format
 * Example: "0987654321" -> "84987654321"
 */
export function convertLocalToInternational(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== "string") return phoneNumber;

  // Remove all non-digit characters
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Check if starts with 0 (Vietnamese local format)
  if (cleanPhone.startsWith("0") && cleanPhone.length >= 10) {
    return "84" + cleanPhone.substring(1);
  }

  return phoneNumber;
}

/**
 * Normalize Vietnamese phone number
 * Supports both local (0xxx) and international (84xxx) formats
 */
export function normalizePhoneNumber(
  phoneNumber: string,
  format: "local" | "international" = "local"
): string {
  if (!phoneNumber) return phoneNumber;

  const cleanPhone = phoneNumber.replace(/\D/g, "");

  if (format === "local") {
    return convertInternationalToLocal(cleanPhone);
  } else {
    return convertLocalToInternational(cleanPhone);
  }
}

/**
 * Create slug from Vietnamese string
 * Removes diacritics, converts to lowercase, and replaces spaces with hyphens
 */
export function createSlug(str: string): string {
  if (!str) return str;

  return removeVietnameseDiacritics(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Truncate string with ellipsis
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix: string = "..."
): string {
  if (!str || str.length <= maxLength) return str;

  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  if (!str) return str;

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format Vietnamese currency
 */
export function formatVietnameseCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
