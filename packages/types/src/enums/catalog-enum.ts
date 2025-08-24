// =================================================================
// CATALOG SERVICE - TYPESCRIPT ENUMS
// =================================================================
// This file contains TypeScript enum definitions that correspond
// to the SMALLINT enum values used in the Catalog Service database schema.
// These enums ensure type safety and consistency between frontend and backend.
// =================================================================

// ===============================================================
// SHARED ENUMS (Used across multiple content types)
// ===============================================================

/**
 * Status enum for content (novels, mangas, animes, volumes, seasons)
 * Maps to SMALLINT values in database
 */
export enum ContentStatus {
  ONGOING = 0,
  COMPLETED = 1,
  HIATUS = 2,
  CANCELLED = 3,
}

/**
 * Content types for purchases and rentals
 */
export enum ContentType {
  NOVEL = "NOVEL",
  NOVEL_VOLUME = "NOVEL_VOLUME",
  NOVEL_CHAPTER = "NOVEL_CHAPTER",
  MANGA = "MANGA",
  MANGA_VOLUME = "MANGA_VOLUME",
  MANGA_CHAPTER = "MANGA_CHAPTER",
  ANIME = "ANIME",
  ANIME_SEASON = "ANIME_SEASON",
  ANIME_EPISODE = "ANIME_EPISODE",
}

/**
 * Classification types for taxonomy system
 */
export enum ClassificationType {
  GENRE = "genre",
  TAG = "tag",
}

/**
 * Alias types for alternative titles
 */
export enum AliasType {
  ALTERNATIVE = "alternative",
  ENGLISH = "english",
  ROMANIZED = "romanized",
  ABBREVIATED = "abbreviated",
}

/**
 * Creator roles in content creation
 */
export enum CreatorRole {
  AUTHOR = "author",
  ILLUSTRATOR = "illustrator",
  ORIGINAL_CREATOR = "original_creator",
  CHARACTER_DESIGNER = "character_designer",
  DIRECTOR = "director",
  WRITER = "writer",
  STUDIO = "studio",
}

/**
 * Character roles in content
 */
export enum CharacterRole {
  MAIN = "main",
  SUPPORTING = "supporting",
  MINOR = "minor",
}

/**
 * Gender enum for characters and seiyuus
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  UNKNOWN = "unknown",
  OTHER = "other",
}

// ===============================================================
// NOVEL-SPECIFIC ENUMS
// ===============================================================

/**
 * Novel publication status
 */
export enum NovelPublicationStatus {
  WEB_NOVEL = 0,
  LIGHT_NOVEL = 1,
  PUBLISHED_BOOK = 2,
}

// ===============================================================
// MANGA-SPECIFIC ENUMS
// ===============================================================

/**
 * Manga publication types
 */
export enum MangaPublicationType {
  MANGA = 0, // Japanese
  MANHWA = 1, // Korean
  MANHUA = 2, // Chinese
  WEBTOON = 3, // Digital format
}

/**
 * Reading direction for manga
 */
export enum ReadingDirection {
  RIGHT_TO_LEFT = 0, // Traditional manga
  LEFT_TO_RIGHT = 1, // Western style
  TOP_TO_BOTTOM = 2, // Webtoon style
}

/**
 * Image formats for manga pages
 */
export enum ImageFormat {
  WEBP = "webp",
  JPG = "jpg",
  PNG = "png",
}

// ===============================================================
// ANIME-SPECIFIC ENUMS
// ===============================================================

/**
 * Anime types
 */
export enum AnimeType {
  TV_SERIES = 0,
  MOVIE = 1,
  OVA = 2, // Original Video Animation
  ONA = 3, // Original Net Animation
  SPECIAL = 4,
}

/**
 * Days of the week for broadcast schedule
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// ===============================================================
// PRICING SYSTEM ENUMS
// ===============================================================

/**
 * Content types for pricing (more granular than ContentType)
 */
export enum PricingContentType {
  // Novel levels
  NOVEL_CHAPTER = "novel_chapter",
  NOVEL_VOLUME = "novel_volume",
  NOVEL = "novel",

  // Manga levels
  MANGA_CHAPTER = "manga_chapter",
  MANGA_VOLUME = "manga_volume",
  MANGA = "manga",

  // Anime levels
  ANIME_EPISODE = "anime_episode",
  ANIME_SEASON = "anime_season",
  ANIME = "anime",
}

/**
 * Pricing types for monetization
 */
export enum PricingType {
  PURCHASE = "purchase", // Buy permanently
  RENTAL = "rental", // Rent with expiration
}

// ===============================================================
// UTILITY TYPES & CONSTANTS
// ===============================================================

/**
 * Language codes (ISO 639-1 format)
 */
export enum LanguageCode {
  VIETNAMESE = "vi",
  ENGLISH = "en",
  JAPANESE = "jp",
  KOREAN = "kr",
  CHINESE = "zh",
}

/**
 * Broadcast seasons for anime
 */
export enum BroadcastSeason {
  SPRING = "Spring",
  SUMMER = "Summer",
  FALL = "Fall",
  WINTER = "Winter",
}

// ===============================================================
// ENUM MAPPINGS & UTILITIES
// ===============================================================

/**
 * Helper function to get enum keys as arrays
 */
export const getEnumKeys = <T extends Record<string, string | number>>(
  enumObject: T,
): Array<keyof T> => {
  return Object.keys(enumObject) as Array<keyof T>;
};

/**
 * Type guards for enum validation
 */
export const isContentStatus = (value: unknown): value is ContentStatus => {
  return (
    typeof value === "number" && Object.values(ContentStatus).includes(value)
  );
};

export const isContentType = (value: unknown): value is ContentType => {
  return (
    typeof value === "string" &&
    Object.values(ContentType).includes(value as ContentType)
  );
};

export const isPricingType = (value: unknown): value is PricingType => {
  return (
    typeof value === "string" &&
    Object.values(PricingType).includes(value as PricingType)
  );
};

export const isAnimeType = (value: unknown): value is AnimeType => {
  return typeof value === "number" && Object.values(AnimeType).includes(value);
};

export const isMangaPublicationType = (
  value: unknown,
): value is MangaPublicationType => {
  return (
    typeof value === "number" &&
    Object.values(MangaPublicationType).includes(value)
  );
};

export const isReadingDirection = (
  value: unknown,
): value is ReadingDirection => {
  return (
    typeof value === "number" && Object.values(ReadingDirection).includes(value)
  );
};

// ===============================================================
// EXPORT ALL ENUMS FOR CONVENIENT IMPORTING
// ===============================================================

export // Main enums are already exported above
 {};

/**
 * Default export containing all enums for bulk import
 */
export default {
  ContentStatus,
  ContentType,
  ClassificationType,
  AliasType,
  CreatorRole,
  CharacterRole,
  Gender,
  NovelPublicationStatus,
  MangaPublicationType,
  ReadingDirection,
  ImageFormat,
  AnimeType,
  DayOfWeek,
  PricingContentType,
  PricingType,
  LanguageCode,
  BroadcastSeason,
};
