// =================================================================
// COMMUNITY SERVICE - TYPESCRIPT ENUMS
// =================================================================
// This file contains TypeScript enum definitions that correspond
// to the SMALLINT enum values used in the Community Service database schema.
// These enums ensure type safety and consistency between frontend and backend.
// =================================================================

// ===============================================================
// COMMENT SYSTEM ENUMS
// ===============================================================

/**
 * Comment content types (polymorphic content support)
 */
export enum CommentContentType {
  NOVEL = 'novel',
  NOVEL_CHAPTER = 'novel_chapter',
  NOVEL_LINE = 'novel_line',          // Plate Editor integration
  MANGA_CHAPTER = 'manga_chapter',
  MANGA_PAGE = 'manga_page',          // Page-level comments for bookmark support
  ANIME = 'anime',
  ANIME_EPISODE = 'anime_episode',
}

/**
 * Comment nesting levels (3-level hierarchy)
 */
export enum CommentNestingLevel {
  ROOT = 0,           // Original comment
  REPLY = 1,          // Reply to root
  REPLY_TO_REPLY = 2, // Reply to reply (max level)
}

/**
 * Comment like types
 */
export enum CommentLikeType {
  LIKE = 1,
  DISLIKE = -1,
}

/**
 * Comment status for moderation
 */
export enum CommentStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
  FLAGGED = 'flagged',
}

// ===============================================================
// REVIEW & RATING SYSTEM ENUMS
// ===============================================================

/**
 * Content types for reviews and ratings
 */
export enum ReviewContentType {
  NOVEL = 'novel',
  MANGA = 'manga',
  ANIME = 'anime',
}

/**
 * Review voting types (helpful/unhelpful)
 */
export enum ReviewVoteType {
  HELPFUL = true,
  UNHELPFUL = false,
}

/**
 * Rating values (1.0 to 5.0 stars)
 */
export enum RatingValue {
  ONE_STAR = 1.0,
  ONE_HALF_STAR = 1.5,
  TWO_STAR = 2.0,
  TWO_HALF_STAR = 2.5,
  THREE_STAR = 3.0,
  THREE_HALF_STAR = 3.5,
  FOUR_STAR = 4.0,
  FOUR_HALF_STAR = 4.5,
  FIVE_STAR = 5.0,
}

// ===============================================================
// WATCHLIST SYSTEM ENUMS
// ===============================================================

/**
 * Watchlist status (MAL-style)
 */
export enum WatchlistStatus {
  PLAN_TO_READ_WATCH = 0,    // Plan to Read (novel/manga) / Plan to Watch (anime)
  READING_WATCHING = 1,      // Currently Reading/Watching
  COMPLETED = 2,             // Completed
  ON_HOLD = 3,              // On Hold / Paused
  DROPPED = 4,              // Dropped
}

/**
 * Content types for watchlist
 */
export enum WatchlistContentType {
  NOVEL = 'novel',
  MANGA = 'manga',
  ANIME = 'anime',
}

/**
 * Custom list visibility
 */
export enum CustomListVisibility {
  PRIVATE = false,
  PUBLIC = true,
}

/**
 * Reading/Viewing progress content types
 */
export enum ProgressContentType {
  NOVEL_CHAPTER = 'novel_chapter',
  NOVEL_LINE = 'novel_line',      // Plate Editor line tracking
  MANGA_PAGE = 'manga_page',      // Page-level progress for bookmark
  ANIME_EPISODE = 'anime_episode', // Timestamp tracking
}

// ===============================================================
// WATCH PARTY SYSTEM ENUMS
// ===============================================================

/**
 * Watch party room status
 */
export enum WatchPartyRoomStatus {
  ACTIVE = 0,
  PAUSED = 1,
  ENDED = 2,
}

/**
 * Watch party participant roles
 */
export enum WatchPartyParticipantRole {
  HOST = 0,         // Room creator (VIP user)
  PARTICIPANT = 1,  // Regular participant
}

/**
 * Watch party message types
 */
export enum WatchPartyMessageType {
  TEXT = 0,    // Regular text chat
  SYSTEM = 1,  // System messages (user joined/left, etc.)
  VOICE = 2,   // Voice message metadata (VIP feature)
}

/**
 * Voice chat permissions
 */
export enum VoiceChatPermission {
  DISABLED = false,
  ENABLED = true,  // VIP-only feature
}

// ===============================================================
// NOTIFICATION SYSTEM ENUMS
// ===============================================================

/**
 * Notification types
 */
export enum NotificationType {
  // Comment notifications
  COMMENT_REPLY = 'comment_reply',
  COMMENT_LIKE = 'comment_like',
  
  // Review notifications  
  REVIEW_LIKE = 'review_like',
  REVIEW_HELPFUL_VOTE = 'review_helpful_vote',
  
  // Content notifications
  NEW_CHAPTER = 'new_chapter',
  NEW_EPISODE = 'new_episode',
  CONTENT_UPDATED = 'content_updated',
  
  // Watchlist notifications
  WATCHLIST_UPDATE = 'watchlist_update',
  FAVORITE_CONTENT_UPDATE = 'favorite_content_update',
  
  // Watch party notifications
  WATCH_PARTY_INVITE = 'watch_party_invite',
  WATCH_PARTY_START = 'watch_party_start',
  
  // System notifications
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ACCOUNT_UPDATE = 'account_update',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
}

/**
 * Notification delivery methods
 */
export enum NotificationDeliveryMethod {
  IN_APP_ONLY = 1,
  PUSH_ONLY = 2,
  BOTH = 3,
}

/**
 * Notification read status
 */
export enum NotificationReadStatus {
  UNREAD = false,
  READ = true,
}

// ===============================================================
// TIMESCALEDB TIME-SERIES EVENT ENUMS
// ===============================================================

/**
 * Comment event types for time-series tracking
 */
export enum CommentEventType {
  CREATED = 'created',
  UPDATED = 'updated', 
  DELETED = 'deleted',
  LIKED = 'liked',
  UNLIKED = 'unliked',
  FLAGGED = 'flagged',
  MODERATED = 'moderated',
}

/**
 * Watch party event types for analytics
 */
export enum WatchPartyEventType {
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_ENDED = 'room_ended',
  VIDEO_PAUSED = 'video_paused',
  VIDEO_PLAYED = 'video_played',
  VIDEO_SEEKED = 'video_seeked',
  MESSAGE_SENT = 'message_sent',
  VOICE_STARTED = 'voice_started',
  VOICE_ENDED = 'voice_ended',
}

/**
 * Notification event types for delivery tracking
 */
export enum NotificationEventType {
  CREATED = 'created',
  DELIVERED = 'delivered',
  READ = 'read',
  CLICKED = 'clicked',
  DISMISSED = 'dismissed',
  FAILED = 'failed',
}

/**
 * User activity event types for engagement analytics
 */
export enum UserActivityEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CONTENT_VIEWED = 'content_viewed',
  COMMENT_POSTED = 'comment_posted',
  REVIEW_POSTED = 'review_posted',
  WATCHLIST_UPDATED = 'watchlist_updated',
  SEARCH_PERFORMED = 'search_performed',
  CONTENT_BOOKMARKED = 'content_bookmarked',
  PROGRESS_UPDATED = 'progress_updated',
}

/**
 * Event metadata device types
 */
export enum EventDeviceType {
  WEB = 'web',
  MOBILE_APP = 'mobile_app',
  TABLET = 'tablet',
  DESKTOP_APP = 'desktop_app',
  TV = 'tv',
  UNKNOWN = 'unknown',
}

/**
 * Time-series aggregation intervals
 */
export enum AggregationInterval {
  HOUR = '1 hour',
  DAY = '1 day',
  WEEK = '1 week',
  MONTH = '1 month',
}

// ===============================================================
// REDIS CACHING ENUMS
// ===============================================================

/**
 * Cache key prefixes for different data types
 */
export enum CacheKeyPrefix {
  COMMENTS_HOT = 'comments:hot',
  COMMENTS_RECENT = 'comments:recent', 
  COMMENTS_COUNT = 'comments:count',
  REVIEWS_SUMMARY = 'reviews:summary',
  WATCHLIST_USER = 'watchlist:user',
  WATCHLIST_STATS = 'watchlist:stats',
  NOTIFICATIONS_UNREAD = 'notifications:unread',
  WATCH_PARTY_ACTIVE = 'watch_party:active',
}

/**
 * Cache TTL (Time To Live) in seconds
 */
export enum CacheTTL {
  SHORT = 300,      // 5 minutes
  MEDIUM = 1800,    // 30 minutes  
  LONG = 3600,      // 1 hour
  VERY_LONG = 86400, // 24 hours
}

// ===============================================================
// UTILITY TYPES & CONSTANTS
// ===============================================================

/**
 * Maximum nesting level for comments
 */
export const MAX_COMMENT_NESTING_LEVEL = 2;

/**
 * Default pagination limits
 */
export const PAGINATION_LIMITS = {
  COMMENTS_PER_PAGE: 20,
  REVIEWS_PER_PAGE: 10,
  WATCHLIST_PER_PAGE: 50,
  NOTIFICATIONS_PER_PAGE: 20,
} as const;

/**
 * Watch party room limits
 */
export const WATCH_PARTY_LIMITS = {
  MAX_PARTICIPANTS: 20,
  DEFAULT_PARTICIPANTS: 10,
  ROOM_DURATION_HOURS: 8,
} as const;

// ===============================================================
// ENUM LABELS & MAPPINGS
// ===============================================================

/**
 * Watchlist status labels for UI display
 */
export const WatchlistStatusLabels: Record<WatchlistStatus, string> = {
  [WatchlistStatus.PLAN_TO_READ_WATCH]: 'Dự định đọc/xem',
  [WatchlistStatus.READING_WATCHING]: 'Đang đọc/xem',
  [WatchlistStatus.COMPLETED]: 'Hoàn thành',
  [WatchlistStatus.ON_HOLD]: 'Tạm dừng',
  [WatchlistStatus.DROPPED]: 'Đã bỏ',
};

/**
 * Comment nesting level labels
 */
export const CommentNestingLevelLabels: Record<CommentNestingLevel, string> = {
  [CommentNestingLevel.ROOT]: 'Bình luận gốc',
  [CommentNestingLevel.REPLY]: 'Trả lời',
  [CommentNestingLevel.REPLY_TO_REPLY]: 'Trả lời của trả lời',
};

/**
 * Watch party room status labels
 */
export const WatchPartyRoomStatusLabels: Record<WatchPartyRoomStatus, string> = {
  [WatchPartyRoomStatus.ACTIVE]: 'Đang hoạt động',
  [WatchPartyRoomStatus.PAUSED]: 'Tạm dừng',
  [WatchPartyRoomStatus.ENDED]: 'Đã kết thúc',
};

/**
 * Notification type labels
 */
export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.COMMENT_REPLY]: 'Trả lời bình luận',
  [NotificationType.COMMENT_LIKE]: 'Thích bình luận',
  [NotificationType.REVIEW_LIKE]: 'Thích đánh giá',
  [NotificationType.REVIEW_HELPFUL_VOTE]: 'Đánh giá hữu ích',
  [NotificationType.NEW_CHAPTER]: 'Chương mới',
  [NotificationType.NEW_EPISODE]: 'Tập mới',
  [NotificationType.CONTENT_UPDATED]: 'Nội dung cập nhật',
  [NotificationType.WATCHLIST_UPDATE]: 'Cập nhật danh sách theo dõi',
  [NotificationType.FAVORITE_CONTENT_UPDATE]: 'Nội dung yêu thích cập nhật',
  [NotificationType.WATCH_PARTY_INVITE]: 'Mời xem chung',
  [NotificationType.WATCH_PARTY_START]: 'Bắt đầu xem chung',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'Thông báo hệ thống',
  [NotificationType.ACCOUNT_UPDATE]: 'Cập nhật tài khoản',
};

/**
 * Notification priority labels
 */
export const NotificationPriorityLabels: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'Thấp',
  [NotificationPriority.NORMAL]: 'Bình thường', 
  [NotificationPriority.HIGH]: 'Cao',
};

/**
 * Comment event type labels for analytics
 */
export const CommentEventTypeLabels: Record<CommentEventType, string> = {
  [CommentEventType.CREATED]: 'Tạo bình luận',
  [CommentEventType.UPDATED]: 'Sửa bình luận',
  [CommentEventType.DELETED]: 'Xóa bình luận',
  [CommentEventType.LIKED]: 'Thích bình luận',
  [CommentEventType.UNLIKED]: 'Bỏ thích bình luận',
  [CommentEventType.FLAGGED]: 'Báo cáo bình luận',
  [CommentEventType.MODERATED]: 'Kiểm duyệt bình luận',
};

/**
 * Watch party event type labels
 */
export const WatchPartyEventTypeLabels: Record<WatchPartyEventType, string> = {
  [WatchPartyEventType.ROOM_CREATED]: 'Tạo phòng xem',
  [WatchPartyEventType.ROOM_JOINED]: 'Tham gia phòng',
  [WatchPartyEventType.ROOM_LEFT]: 'Rời phòng',
  [WatchPartyEventType.ROOM_ENDED]: 'Kết thúc phòng',
  [WatchPartyEventType.VIDEO_PAUSED]: 'Tạm dừng video',
  [WatchPartyEventType.VIDEO_PLAYED]: 'Phát video',
  [WatchPartyEventType.VIDEO_SEEKED]: 'Tua video',
  [WatchPartyEventType.MESSAGE_SENT]: 'Gửi tin nhắn',
  [WatchPartyEventType.VOICE_STARTED]: 'Bắt đầu voice chat',
  [WatchPartyEventType.VOICE_ENDED]: 'Kết thúc voice chat',
};

/**
 * User activity event type labels
 */
export const UserActivityEventTypeLabels: Record<UserActivityEventType, string> = {
  [UserActivityEventType.LOGIN]: 'Đăng nhập',
  [UserActivityEventType.LOGOUT]: 'Đăng xuất',
  [UserActivityEventType.CONTENT_VIEWED]: 'Xem nội dung',
  [UserActivityEventType.COMMENT_POSTED]: 'Đăng bình luận',
  [UserActivityEventType.REVIEW_POSTED]: 'Đăng đánh giá',
  [UserActivityEventType.WATCHLIST_UPDATED]: 'Cập nhật watchlist',
  [UserActivityEventType.SEARCH_PERFORMED]: 'Tìm kiếm',
  [UserActivityEventType.CONTENT_BOOKMARKED]: 'Đánh dấu nội dung',
  [UserActivityEventType.PROGRESS_UPDATED]: 'Cập nhật tiến độ',
};

// ===============================================================
// TYPE GUARDS & VALIDATION
// ===============================================================

/**
 * Type guards for enum validation
 */
export const isWatchlistStatus = (value: unknown): value is WatchlistStatus => {
  return typeof value === 'number' && Object.values(WatchlistStatus).includes(value);
};

export const isCommentContentType = (value: unknown): value is CommentContentType => {
  return typeof value === 'string' && Object.values(CommentContentType).includes(value as CommentContentType);
};

export const isNotificationType = (value: unknown): value is NotificationType => {
  return typeof value === 'string' && Object.values(NotificationType).includes(value as NotificationType);
};

export const isWatchPartyRoomStatus = (value: unknown): value is WatchPartyRoomStatus => {
  return typeof value === 'number' && Object.values(WatchPartyRoomStatus).includes(value);
};

export const isValidRating = (value: number): value is RatingValue => {
  return value >= 1.0 && value <= 5.0 && (value * 2) % 1 === 0; // Allow half-star increments
};

export const isValidCommentNesting = (level: number): boolean => {
  return level >= 0 && level <= MAX_COMMENT_NESTING_LEVEL;
};

export const isCommentEventType = (value: unknown): value is CommentEventType => {
  return typeof value === 'string' && Object.values(CommentEventType).includes(value as CommentEventType);
};

export const isWatchPartyEventType = (value: unknown): value is WatchPartyEventType => {
  return typeof value === 'string' && Object.values(WatchPartyEventType).includes(value as WatchPartyEventType);
};

export const isNotificationEventType = (value: unknown): value is NotificationEventType => {
  return typeof value === 'string' && Object.values(NotificationEventType).includes(value as NotificationEventType);
};

export const isUserActivityEventType = (value: unknown): value is UserActivityEventType => {
  return typeof value === 'string' && Object.values(UserActivityEventType).includes(value as UserActivityEventType);
};

export const isEventDeviceType = (value: unknown): value is EventDeviceType => {
  return typeof value === 'string' && Object.values(EventDeviceType).includes(value as EventDeviceType);
};

// ===============================================================
// UTILITY FUNCTIONS
// ===============================================================

/**
 * Build cache key for different data types
 */
export const buildCacheKey = (prefix: CacheKeyPrefix, ...parts: string[]): string => {
  return [prefix, ...parts].join(':');
};

/**
 * Get appropriate cache TTL based on data type
 */
export const getCacheTTL = (dataType: 'hot_comments' | 'recent_comments' | 'reviews' | 'watchlist' | 'notifications'): number => {
  switch (dataType) {
    case 'notifications':
      return CacheTTL.SHORT; // 5 minutes
    case 'hot_comments':
    case 'recent_comments':
    case 'reviews':
    case 'watchlist':
    default:
      return CacheTTL.LONG; // 1 hour
  }
};

/**
 * Check if user can create watch party room (VIP only)
 */
export const canCreateWatchPartyRoom = (userSubscriptionPlan: number): boolean => {
  // Assuming VIP = 2 from account-enum.ts SubscriptionPlanType
  return userSubscriptionPlan >= 2;
};

/**
 * Get comment depth from path
 */
export const getCommentDepthFromPath = (path: string): number => {
  return path.split('.').length - 1;
};

/**
 * Validate comment nesting level
 */
export const validateCommentNesting = (parentPath?: string): CommentNestingLevel => {
  if (!parentPath) return CommentNestingLevel.ROOT;
  
  const depth = getCommentDepthFromPath(parentPath);
  if (depth >= MAX_COMMENT_NESTING_LEVEL) {
    throw new Error(`Comment nesting exceeds maximum level of ${MAX_COMMENT_NESTING_LEVEL}`);
  }
  
  return (depth + 1) as CommentNestingLevel;
};

/**
 * Format watchlist status for display based on content type
 */
export const formatWatchlistStatusLabel = (status: WatchlistStatus, contentType: WatchlistContentType): string => {
  const baseLabel = WatchlistStatusLabels[status];
  
  if (status === WatchlistStatus.PLAN_TO_READ_WATCH) {
    switch (contentType) {
      case WatchlistContentType.NOVEL:
      case WatchlistContentType.MANGA:
        return 'Dự định đọc';
      case WatchlistContentType.ANIME:
        return 'Dự định xem';
    }
  }
  
  if (status === WatchlistStatus.READING_WATCHING) {
    switch (contentType) {
      case WatchlistContentType.NOVEL:
      case WatchlistContentType.MANGA:
        return 'Đang đọc';
      case WatchlistContentType.ANIME:
        return 'Đang xem';
    }
  }
  
  return baseLabel;
};

// ===============================================================
// EXPORT ALL ENUMS FOR CONVENIENT IMPORTING
// ===============================================================

export {
  // Main enums are already exported above
};

/**
 * Default export containing all enums for bulk import
 */
export default {
  CommentContentType,
  CommentNestingLevel,
  CommentLikeType,
  CommentStatus,
  ReviewContentType,
  ReviewVoteType,
  RatingValue,
  WatchlistStatus,
  WatchlistContentType,
  CustomListVisibility,
  ProgressContentType,
  WatchPartyRoomStatus,
  WatchPartyParticipantRole,
  WatchPartyMessageType,
  VoiceChatPermission,
  NotificationType,
  NotificationPriority,
  NotificationDeliveryMethod,
  NotificationReadStatus,
  // TimescaleDB Time-series Event Enums
  CommentEventType,
  WatchPartyEventType,
  NotificationEventType,
  UserActivityEventType,
  EventDeviceType,
  AggregationInterval,
  CacheKeyPrefix,
  CacheTTL,
  PAGINATION_LIMITS,
  WATCH_PARTY_LIMITS,
  MAX_COMMENT_NESTING_LEVEL,
};