-- =================================================================
--        COMMUNITY SERVICE DATABASE SCHEMA - SELF-DOCUMENTING
-- =================================================================
-- This script contains the complete schema for the Community Service.
-- It manages all social interactions: comments (3-level hierarchy),
-- reviews, watchlists, watch parties, and real-time notifications.
-- Includes Redis caching strategy documentation and performance
-- optimizations for real-time features.
-- =================================================================

-- Kích hoạt các extension cần thiết
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- For gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS timescaledb; -- For time-series functionality

BEGIN;

-- ===============================================================
-- SECTION 1: COMMENTS SYSTEM (3-Level Hierarchy)
-- ===============================================================

-- 1) COMMENTS (Support 3-level nesting with polymorphic content support)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References users.id from Account Service
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel', 'novel_chapter', 'novel_line', 'manga_chapter', 'manga_page', 'anime', 'anime_episode')),
    content_id UUID NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    root_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    nesting_level SMALLINT NOT NULL DEFAULT 0 CHECK (nesting_level >= 0 AND nesting_level <= 2),
    path TEXT NOT NULL, -- Materialized path for efficient hierarchy queries (e.g., "root_uuid.parent_uuid.comment_uuid")
    like_count INT DEFAULT 0,
    dislike_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE comments IS 'Hệ thống bình luận 3-cấp với hỗ trợ đa loại content (novel/manga/anime)';
COMMENT ON COLUMN comments.id IS 'ID của comment (Primary Key)';
COMMENT ON COLUMN comments.user_id IS 'ID người dùng tạo comment (reference Account Service)';
COMMENT ON COLUMN comments.content_type IS 'Loại content: novel, novel_chapter, novel_line (plate editor), manga_chapter, manga_page, anime, anime_episode';
COMMENT ON COLUMN comments.content_id IS 'ID của content tương ứng (novel.id, chapter.id, page.id, etc.)';
COMMENT ON COLUMN comments.parent_id IS 'ID comment cha (null nếu là root comment)';
COMMENT ON COLUMN comments.root_id IS 'ID comment gốc của thread (null nếu chính nó là root)';
COMMENT ON COLUMN comments.content IS 'Nội dung bình luận (text)';
COMMENT ON COLUMN comments.nesting_level IS 'Cấp độ lồng nhau: 0=root, 1=reply, 2=reply to reply (tối đa 3 cấp)';
COMMENT ON COLUMN comments.path IS 'Materialized path cho truy vấn hierarchy hiệu quả';
COMMENT ON COLUMN comments.like_count IS 'Số lượt thích (denormalized cho performance)';
COMMENT ON COLUMN comments.dislike_count IS 'Số lượt không thích (denormalized cho performance)';
COMMENT ON COLUMN comments.reply_count IS 'Số lượt reply (denormalized cho performance)';
COMMENT ON COLUMN comments.is_deleted IS 'Soft delete cho moderation';
COMMENT ON COLUMN comments.is_pinned IS 'Comment được ghim lên đầu';
COMMENT ON COLUMN comments.is_edited IS 'Comment đã được chỉnh sửa';
COMMENT ON COLUMN comments.edited_at IS 'Thời điểm chỉnh sửa lần cuối';
COMMENT ON COLUMN comments.deleted_at IS 'Thời điểm soft delete';
COMMENT ON COLUMN comments.created_at IS 'Thời điểm tạo comment';
COMMENT ON COLUMN comments.updated_at IS 'Thời điểm cập nhật comment';

-- 2) COMMENT_LIKES (Like/Dislike system)
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References users.id from Account Service
    like_type SMALLINT NOT NULL CHECK (like_type IN (1, -1)), -- 1=like, -1=dislike
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(comment_id, user_id)
);

COMMENT ON TABLE comment_likes IS 'Hệ thống like/dislike cho comments';
COMMENT ON COLUMN comment_likes.comment_id IS 'ID của comment được like/dislike';
COMMENT ON COLUMN comment_likes.user_id IS 'ID người dùng thực hiện like/dislike';
COMMENT ON COLUMN comment_likes.like_type IS '1=like, -1=dislike (một user chỉ có thể like hoặc dislike)';
COMMENT ON COLUMN comment_likes.created_at IS 'Thời điểm like/dislike';

-- ===============================================================
-- SECTION 2: REVIEWS & RATINGS SYSTEM
-- ===============================================================

-- 3) REVIEWS (Detailed reviews with text + rating)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References users.id from Account Service
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel', 'manga', 'anime')),
    content_id UUID NOT NULL,
    title VARCHAR(255),
    content TEXT,
    rating DECIMAL(2,1) CHECK (rating >= 1.0 AND rating <= 5.0),
    is_spoiler BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    unhelpful_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, content_type, content_id)
);

COMMENT ON TABLE reviews IS 'Hệ thống review chi tiết với text và rating cho content';
COMMENT ON COLUMN reviews.id IS 'ID của review (Primary Key)';
COMMENT ON COLUMN reviews.user_id IS 'ID người dùng viết review';
COMMENT ON COLUMN reviews.content_type IS 'Loại content được review (novel/manga/anime)';
COMMENT ON COLUMN reviews.content_id IS 'ID của content được review';
COMMENT ON COLUMN reviews.title IS 'Tiêu đề review (tùy chọn)';
COMMENT ON COLUMN reviews.content IS 'Nội dung review chi tiết';
COMMENT ON COLUMN reviews.rating IS 'Điểm số từ 1.0 đến 5.0 (có thể null nếu chỉ có text)';
COMMENT ON COLUMN reviews.is_spoiler IS 'Review có chứa spoiler không';
COMMENT ON COLUMN reviews.helpful_count IS 'Số lượt đánh giá "hữu ích"';
COMMENT ON COLUMN reviews.unhelpful_count IS 'Số lượt đánh giá "không hữu ích"';
COMMENT ON COLUMN reviews.created_at IS 'Thời điểm tạo review';
COMMENT ON COLUMN reviews.updated_at IS 'Thời điểm cập nhật review';

-- 4) RATINGS (Quick ratings without text)
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References users.id from Account Service
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel', 'manga', 'anime')),
    content_id UUID NOT NULL,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, content_type, content_id)
);

COMMENT ON TABLE ratings IS 'Hệ thống rating nhanh chỉ có số sao (không có text)';
COMMENT ON COLUMN ratings.user_id IS 'ID người dùng đánh giá';
COMMENT ON COLUMN ratings.content_type IS 'Loại content được đánh giá';
COMMENT ON COLUMN ratings.content_id IS 'ID của content được đánh giá';
COMMENT ON COLUMN ratings.rating IS 'Điểm số từ 1.0 đến 5.0';

-- 5) REVIEW_LIKES (Helpful/Unhelpful votes for reviews)
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References users.id from Account Service
    is_helpful BOOLEAN NOT NULL, -- true=helpful, false=unhelpful
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(review_id, user_id)
);

COMMENT ON TABLE review_likes IS 'Hệ thống đánh giá review là hữu ích hay không';
COMMENT ON COLUMN review_likes.review_id IS 'ID của review được đánh giá';
COMMENT ON COLUMN review_likes.user_id IS 'ID người dùng đánh giá';
COMMENT ON COLUMN review_likes.is_helpful IS 'true=hữu ích, false=không hữu ích';

-- ===============================================================
-- SECTION 3: WATCHLIST SYSTEM
-- ===============================================================

-- 6) USER_WATCHLISTS (Personal watchlists with MAL-style states)
CREATE TABLE IF NOT EXISTS user_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References users.id from Account Service
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel', 'manga', 'anime')),
    content_id UUID NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0, -- 0=Plan to Read/Watch, 1=Reading/Watching, 2=Completed, 3=On Hold, 4=Dropped
    personal_rating DECIMAL(2,1) CHECK (personal_rating >= 1.0 AND personal_rating <= 5.0),
    personal_notes TEXT,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE,
    finish_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, content_type, content_id)
);

COMMENT ON TABLE user_watchlists IS 'Danh sách theo dõi cá nhân với các trạng thái giống MAL/AniList';
COMMENT ON COLUMN user_watchlists.user_id IS 'ID người dùng sở hữu watchlist';
COMMENT ON COLUMN user_watchlists.content_type IS 'Loại content trong watchlist';
COMMENT ON COLUMN user_watchlists.content_id IS 'ID của content';
COMMENT ON COLUMN user_watchlists.status IS '0=Plan to Read/Watch, 1=Reading/Watching, 2=Completed, 3=On Hold, 4=Dropped';
COMMENT ON COLUMN user_watchlists.personal_rating IS 'Điểm đánh giá cá nhân (1.0-5.0)';
COMMENT ON COLUMN user_watchlists.personal_notes IS 'Ghi chú cá nhân về content';
COMMENT ON COLUMN user_watchlists.is_favorite IS 'Có phải là content yêu thích không';
COMMENT ON COLUMN user_watchlists.is_public IS 'Watchlist có public không';
COMMENT ON COLUMN user_watchlists.start_date IS 'Ngày bắt đầu đọc/xem';
COMMENT ON COLUMN user_watchlists.finish_date IS 'Ngày hoàn thành';

-- 7) CUSTOM_LISTS (User-created custom lists)
CREATE TABLE IF NOT EXISTS custom_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References users.id from Account Service
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_collaborative BOOLEAN NOT NULL DEFAULT FALSE,
    item_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE custom_lists IS 'Danh sách tùy chỉnh do người dùng tạo (ví dụ: "Top 10 anime thư giãn")';
COMMENT ON COLUMN custom_lists.user_id IS 'ID người tạo list';
COMMENT ON COLUMN custom_lists.name IS 'Tên danh sách';
COMMENT ON COLUMN custom_lists.description IS 'Mô tả danh sách';
COMMENT ON COLUMN custom_lists.is_public IS 'Danh sách có public không';
COMMENT ON COLUMN custom_lists.is_collaborative IS 'Cho phép người khác đóng góp không';
COMMENT ON COLUMN custom_lists.item_count IS 'Số item trong list (denormalized)';

-- 8) CUSTOM_LIST_ITEMS (Items in custom lists)
CREATE TABLE IF NOT EXISTS custom_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_list_id UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel', 'manga', 'anime')),
    content_id UUID NOT NULL,
    order_index INT NOT NULL,
    notes TEXT,
    added_by_user_id UUID NOT NULL, -- References users.id (for collaborative lists)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(custom_list_id, content_type, content_id)
);

COMMENT ON TABLE custom_list_items IS 'Các item trong custom lists';
COMMENT ON COLUMN custom_list_items.custom_list_id IS 'ID của custom list';
COMMENT ON COLUMN custom_list_items.content_type IS 'Loại content';
COMMENT ON COLUMN custom_list_items.content_id IS 'ID của content';
COMMENT ON COLUMN custom_list_items.order_index IS 'Thứ tự trong list';
COMMENT ON COLUMN custom_list_items.notes IS 'Ghi chú về item này';
COMMENT ON COLUMN custom_list_items.added_by_user_id IS 'Người thêm item (cho collaborative lists)';

-- 9) READING_PROGRESS (Progress tracking - non-continuous sync)
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References users.id from Account Service
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel_chapter', 'novel_line', 'manga_page', 'anime_episode')),
    content_id UUID NOT NULL,
    progress_data JSONB NOT NULL, -- {"chapter_id": "uuid", "line_id": "uuid", "position": 123} or {"page_id": "uuid", "scroll_position": 0.7} or {"episode_id": "uuid", "timestamp": 1500}
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, content_type, content_id)
);

COMMENT ON TABLE reading_progress IS 'Theo dõi tiến độ đọc/xem (không sync liên tục)';
COMMENT ON COLUMN reading_progress.user_id IS 'ID người dùng';
COMMENT ON COLUMN reading_progress.content_type IS 'Loại progress: novel_chapter, novel_line, manga_page, anime_episode';
COMMENT ON COLUMN reading_progress.content_id IS 'ID của content';
COMMENT ON COLUMN reading_progress.progress_data IS 'JSONB chứa chi tiết progress theo từng loại content';
COMMENT ON COLUMN reading_progress.percentage IS 'Phần trăm hoàn thành (0-100)';
COMMENT ON COLUMN reading_progress.last_accessed_at IS 'Lần cuối truy cập';

-- ===============================================================
-- SECTION 4: WATCH PARTY SYSTEM (Real-time)
-- ===============================================================

-- 10) WATCH_PARTY_ROOMS (VIP-only temporary rooms)
CREATE TABLE IF NOT EXISTS watch_party_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_user_id UUID NOT NULL, -- References users.id (must be VIP)
    anime_episode_id UUID NOT NULL, -- References anime_episodes.id from Catalog Service
    room_name VARCHAR(100) NOT NULL,
    room_password VARCHAR(100), -- Optional password protection
    max_participants INT NOT NULL DEFAULT 10,
    current_participants INT DEFAULT 0,
    current_watch_timestap INT DEFAULT 0, -- Current playback position in seconds
    is_playing BOOLEAN NOT NULL DEFAULT FALSE,
    is_voice_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- VIP feature
    room_status SMALLINT NOT NULL DEFAULT 0, -- 0=Active, 1=Paused, 2=Ended
    expires_at TIMESTAMPTZ NOT NULL, -- Temporary rooms
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE watch_party_rooms IS 'Phòng xem chung tạm thời (chỉ VIP mới được tạo)';
COMMENT ON COLUMN watch_party_rooms.host_user_id IS 'ID người tạo phòng (phải là VIP)';
COMMENT ON COLUMN watch_party_rooms.anime_episode_id IS 'ID episode được xem chung';
COMMENT ON COLUMN watch_party_rooms.room_name IS 'Tên phòng';
COMMENT ON COLUMN watch_party_rooms.room_password IS 'Mật khẩu phòng (tùy chọn)';
COMMENT ON COLUMN watch_party_rooms.max_participants IS 'Số người tối đa';
COMMENT ON COLUMN watch_party_rooms.current_participants IS 'Số người hiện tại (denormalized)';
COMMENT ON COLUMN watch_party_rooms.current_watch_timestap IS 'Vị trí phát hiện tại (giây)';
COMMENT ON COLUMN watch_party_rooms.is_playing IS 'Phòng đang phát hay pause';
COMMENT ON COLUMN watch_party_rooms.is_voice_enabled IS 'Có bật voice chat không (VIP feature)';
COMMENT ON COLUMN watch_party_rooms.room_status IS '0=Active, 1=Paused, 2=Ended';
COMMENT ON COLUMN watch_party_rooms.expires_at IS 'Thời điểm phòng hết hạn (temporary)';

-- 11) WATCH_PARTY_PARTICIPANTS (User presence in rooms)
CREATE TABLE IF NOT EXISTS watch_party_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES watch_party_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References users.id from Account Service
    role SMALLINT NOT NULL DEFAULT 1, -- 0=Host, 1=Participant
    has_voice_permission BOOLEAN NOT NULL DEFAULT FALSE, -- VIP feature
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(room_id, user_id)
);

COMMENT ON TABLE watch_party_participants IS 'Người tham gia phòng xem chung';
COMMENT ON COLUMN watch_party_participants.room_id IS 'ID phòng';
COMMENT ON COLUMN watch_party_participants.user_id IS 'ID người tham gia';
COMMENT ON COLUMN watch_party_participants.role IS '0=Host (người tạo), 1=Participant';
COMMENT ON COLUMN watch_party_participants.has_voice_permission IS 'Có quyền voice chat không (VIP feature)';
COMMENT ON COLUMN watch_party_participants.is_muted IS 'Bị tắt tiếng';
COMMENT ON COLUMN watch_party_participants.joined_at IS 'Thời điểm vào phòng';
COMMENT ON COLUMN watch_party_participants.last_seen_at IS 'Lần cuối online';

-- 12) WATCH_PARTY_MESSAGES (Chat messages in watch party)
CREATE TABLE IF NOT EXISTS watch_party_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES watch_party_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References users.id from Account Service
    message_type SMALLINT NOT NULL DEFAULT 0, -- 0=Text, 1=System, 2=Voice (metadata)
    content TEXT,
    voice_metadata JSONB, -- For voice messages: {"duration": 5000, "file_url": "s3://..."}
    timestamp_at INT, -- Video timestamp when message was sent
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE watch_party_messages IS 'Tin nhắn chat trong phòng xem chung';
COMMENT ON COLUMN watch_party_messages.room_id IS 'ID phòng';
COMMENT ON COLUMN watch_party_messages.user_id IS 'ID người gửi tin nhắn';
COMMENT ON COLUMN watch_party_messages.message_type IS '0=Text chat, 1=System message, 2=Voice message metadata';
COMMENT ON COLUMN watch_party_messages.content IS 'Nội dung tin nhắn text';
COMMENT ON COLUMN watch_party_messages.voice_metadata IS 'Metadata cho voice messages (VIP feature)';
COMMENT ON COLUMN watch_party_messages.timestamp_at IS 'Thời điểm trong video khi gửi tin nhắn';

-- ===============================================================
-- SECTION 5: NOTIFICATION SYSTEM
-- ===============================================================

-- 13) NOTIFICATIONS (Real-time notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References users.id (recipient)
    type VARCHAR(50) NOT NULL, -- comment_reply, review_like, new_chapter, etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,
    data JSONB, -- Additional data: {"comment_id": "uuid", "content_title": "Manga Name"}
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_pushed BOOLEAN NOT NULL DEFAULT FALSE, -- Sent via push notification
    priority SMALLINT NOT NULL DEFAULT 1, -- 0=Low, 1=Normal, 2=High
    expires_at TIMESTAMPTZ, -- Optional expiration
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

COMMENT ON TABLE notifications IS 'Hệ thống thông báo real-time';
COMMENT ON COLUMN notifications.user_id IS 'ID người nhận thông báo';
COMMENT ON COLUMN notifications.type IS 'Loại thông báo: comment_reply, review_like, new_chapter, new_episode, etc.';
COMMENT ON COLUMN notifications.title IS 'Tiêu đề thông báo';
COMMENT ON COLUMN notifications.content IS 'Nội dung thông báo';
COMMENT ON COLUMN notifications.data IS 'JSONB chứa dữ liệu bổ sung';
COMMENT ON COLUMN notifications.is_read IS 'Đã đọc chưa';
COMMENT ON COLUMN notifications.is_pushed IS 'Đã gửi push notification chưa';
COMMENT ON COLUMN notifications.priority IS '0=Low, 1=Normal, 2=High';
COMMENT ON COLUMN notifications.expires_at IS 'Thời điểm hết hạn (tùy chọn)';
COMMENT ON COLUMN notifications.read_at IS 'Thời điểm đã đọc';

-- 14) NOTIFICATION_PREFERENCES (User notification preferences)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References users.id from Account Service
    notification_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_method SMALLINT NOT NULL DEFAULT 3, -- 1=In-app only, 2=Push only, 3=Both
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, notification_type)
);

COMMENT ON TABLE notification_preferences IS 'Tùy chỉnh thông báo của người dùng';
COMMENT ON COLUMN notification_preferences.user_id IS 'ID người dùng';
COMMENT ON COLUMN notification_preferences.notification_type IS 'Loại thông báo';
COMMENT ON COLUMN notification_preferences.is_enabled IS 'Có bật thông báo này không';
COMMENT ON COLUMN notification_preferences.delivery_method IS '1=Chỉ in-app, 2=Chỉ push, 3=Cả hai';

-- ===============================================================
-- SECTION 6: PERFORMANCE INDEXES & OPTIMIZATION
-- ===============================================================

-- Comment system indexes
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_root ON comments (root_id) WHERE root_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_path ON comments USING GIN (to_tsvector('simple', path));
CREATE INDEX IF NOT EXISTS idx_comments_created_desc ON comments (created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_likes_desc ON comments (like_count DESC) WHERE is_deleted = FALSE;

-- Comment likes indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes (user_id);

-- Review system indexes
CREATE INDEX IF NOT EXISTS idx_reviews_content ON reviews (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating DESC) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON reviews (helpful_count DESC);

CREATE INDEX IF NOT EXISTS idx_ratings_content ON ratings (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings (user_id);

-- Watchlist indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON user_watchlists (user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_content ON user_watchlists (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_status ON user_watchlists (status);
CREATE INDEX IF NOT EXISTS idx_watchlists_public ON user_watchlists (is_public) WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_custom_lists_user ON custom_lists (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_public ON custom_lists (is_public) WHERE is_public = TRUE;

-- Progress tracking indexes
CREATE INDEX IF NOT EXISTS idx_progress_user ON reading_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_progress_content ON reading_progress (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_progress_accessed ON reading_progress (last_accessed_at DESC);

-- Watch party indexes
CREATE INDEX IF NOT EXISTS idx_watch_party_host ON watch_party_rooms (host_user_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_episode ON watch_party_rooms (anime_episode_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_status ON watch_party_rooms (room_status) WHERE room_status = 0;
CREATE INDEX IF NOT EXISTS idx_watch_party_expires ON watch_party_rooms (expires_at);

CREATE INDEX IF NOT EXISTS idx_party_participants_room ON watch_party_participants (room_id);
CREATE INDEX IF NOT EXISTS idx_party_participants_user ON watch_party_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_party_messages_room ON watch_party_messages (room_id);
CREATE INDEX IF NOT EXISTS idx_party_messages_created ON watch_party_messages (created_at DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications (priority DESC, created_at DESC);

-- ===============================================================
-- SECTION 7: TIMESCALEDB TIME-SERIES TABLES & REAL-TIME ANALYTICS
-- ===============================================================

-- 15) COMMENT_EVENTS (Time-series tracking for comment activity)
CREATE TABLE IF NOT EXISTS comment_events (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- created, liked, disliked, edited, deleted
    user_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    content_id UUID NOT NULL,
    parent_comment_id UUID,
    nesting_level SMALLINT,
    metadata JSONB DEFAULT '{}'
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('comment_events', 'time', if_not_exists => TRUE);

COMMENT ON TABLE comment_events IS 'Time-series tracking cho tất cả comment events (TimescaleDB hypertable)';
COMMENT ON COLUMN comment_events.time IS 'Timestamp của event';
COMMENT ON COLUMN comment_events.comment_id IS 'ID của comment liên quan';
COMMENT ON COLUMN comment_events.event_type IS 'Loại event: created, liked, disliked, edited, deleted';
COMMENT ON COLUMN comment_events.user_id IS 'ID người dùng thực hiện action';
COMMENT ON COLUMN comment_events.content_type IS 'Loại content được comment';
COMMENT ON COLUMN comment_events.content_id IS 'ID của content';
COMMENT ON COLUMN comment_events.metadata IS 'Metadata bổ sung (like_count, content preview, etc.)';

-- 16) WATCH_PARTY_EVENTS (Real-time watch party activity)
CREATE TABLE IF NOT EXISTS watch_party_events (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    room_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- room_created, user_joined, user_left, message_sent, video_paused, video_played
    user_id UUID,
    participant_count INT,
    video_timestamp INT, -- Current video position when event occurred
    metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('watch_party_events', 'time', if_not_exists => TRUE);

COMMENT ON TABLE watch_party_events IS 'Time-series tracking cho watch party activities';
COMMENT ON COLUMN watch_party_events.room_id IS 'ID của watch party room';
COMMENT ON COLUMN watch_party_events.event_type IS 'Loại event: room_created, user_joined, user_left, message_sent, video_paused, video_played';
COMMENT ON COLUMN watch_party_events.user_id IS 'ID người dùng (null cho system events)';
COMMENT ON COLUMN watch_party_events.participant_count IS 'Số người tham gia tại thời điểm event';
COMMENT ON COLUMN watch_party_events.video_timestamp IS 'Vị trí video khi event xảy ra (seconds)';

-- 17) NOTIFICATION_EVENTS (Notification delivery tracking)
CREATE TABLE IF NOT EXISTS notification_events (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- sent, delivered, read, clicked, dismissed
    delivery_method VARCHAR(20), -- in_app, push, email
    response_time_ms INT, -- Time from sent to read/clicked
    metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('notification_events', 'time', if_not_exists => TRUE);

COMMENT ON TABLE notification_events IS 'Time-series tracking cho notification delivery và engagement';
COMMENT ON COLUMN notification_events.notification_id IS 'ID của notification';
COMMENT ON COLUMN notification_events.event_type IS 'Loại event: sent, delivered, read, clicked, dismissed';
COMMENT ON COLUMN notification_events.delivery_method IS 'Phương thức gửi: in_app, push, email';
COMMENT ON COLUMN notification_events.response_time_ms IS 'Thời gian phản hồi từ sent đến read/clicked (milliseconds)';

-- 18) USER_ACTIVITY_EVENTS (User engagement metrics)
CREATE TABLE IF NOT EXISTS user_activity_events (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- page_view, comment_created, review_written, watchlist_updated
    content_type VARCHAR(20),
    content_id UUID,
    session_duration_seconds INT,
    device_type VARCHAR(20), -- web, mobile, tablet
    metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('user_activity_events', 'time', if_not_exists => TRUE);

COMMENT ON TABLE user_activity_events IS 'Time-series tracking cho user engagement và activity patterns';
COMMENT ON COLUMN user_activity_events.activity_type IS 'Loại hoạt động: page_view, comment_created, review_written, watchlist_updated';
COMMENT ON COLUMN user_activity_events.session_duration_seconds IS 'Thời gian session (nếu có)';
COMMENT ON COLUMN user_activity_events.device_type IS 'Loại thiết bị: web, mobile, tablet';

-- ===============================================================
-- SECTION 8: CONTINUOUS AGGREGATES (Real-time Analytics)
-- ===============================================================

-- Real-time comment statistics per hour
CREATE MATERIALIZED VIEW hourly_comment_stats
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS hour,
       content_type,
       content_id,
       COUNT(*) FILTER (WHERE event_type = 'created') AS comments_created,
       COUNT(*) FILTER (WHERE event_type = 'liked') AS likes_given,
       COUNT(*) FILTER (WHERE event_type = 'disliked') AS dislikes_given,
       COUNT(DISTINCT user_id) AS unique_users,
       AVG(nesting_level) FILTER (WHERE event_type = 'created') AS avg_nesting_level
FROM comment_events
GROUP BY hour, content_type, content_id
WITH NO DATA;

-- Enable real-time aggregation
SELECT add_continuous_aggregate_policy('hourly_comment_stats',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- Real-time watch party statistics
CREATE MATERIALIZED VIEW hourly_watch_party_stats
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS hour,
       COUNT(*) FILTER (WHERE event_type = 'room_created') AS rooms_created,
       COUNT(*) FILTER (WHERE event_type = 'user_joined') AS users_joined,
       COUNT(*) FILTER (WHERE event_type = 'message_sent') AS messages_sent,
       AVG(participant_count) AS avg_participants,
       COUNT(DISTINCT room_id) AS unique_rooms,
       COUNT(DISTINCT user_id) AS unique_users
FROM watch_party_events
GROUP BY hour
WITH NO DATA;

SELECT add_continuous_aggregate_policy('hourly_watch_party_stats',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- Real-time notification delivery metrics
CREATE MATERIALIZED VIEW hourly_notification_stats
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS hour,
       delivery_method,
       COUNT(*) FILTER (WHERE event_type = 'sent') AS notifications_sent,
       COUNT(*) FILTER (WHERE event_type = 'delivered') AS notifications_delivered,
       COUNT(*) FILTER (WHERE event_type = 'read') AS notifications_read,
       AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL) AS avg_response_time_ms,
       (COUNT(*) FILTER (WHERE event_type = 'read')::FLOAT /
        NULLIF(COUNT(*) FILTER (WHERE event_type = 'sent'), 0)) * 100 AS read_rate_percent
FROM notification_events
GROUP BY hour, delivery_method
WITH NO DATA;

SELECT add_continuous_aggregate_policy('hourly_notification_stats',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- ===============================================================
-- SECTION 9: REAL-TIME TRIGGERS & NOTIFICATIONS
-- ===============================================================

-- Function to track comment events
CREATE OR REPLACE FUNCTION track_comment_event()
RETURNS TRIGGER AS $$
DECLARE
    event_type_val TEXT;
    metadata_val JSONB;
BEGIN
    -- Determine event type based on operation
    IF TG_OP = 'INSERT' THEN
        event_type_val := 'created';
        metadata_val := jsonb_build_object(
            'content', LEFT(NEW.content, 100),
            'nesting_level', NEW.nesting_level
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
            event_type_val := 'deleted';
        ELSIF OLD.content != NEW.content THEN
            event_type_val := 'edited';
        END IF;
        metadata_val := jsonb_build_object(
            'like_count', NEW.like_count,
            'dislike_count', NEW.dislike_count
        );
    ELSIF TG_OP = 'DELETE' THEN
        event_type_val := 'deleted';
        metadata_val := '{}';
    END IF;

    -- Insert into time-series table
    IF event_type_val IS NOT NULL THEN
        INSERT INTO comment_events (
            comment_id, event_type, user_id, content_type, content_id,
            parent_comment_id, nesting_level, metadata
        ) VALUES (
            COALESCE(NEW.id, OLD.id),
            event_type_val,
            COALESCE(NEW.user_id, OLD.user_id),
            COALESCE(NEW.content_type, OLD.content_type),
            COALESCE(NEW.content_id, OLD.content_id),
            COALESCE(NEW.parent_id, OLD.parent_id),
            COALESCE(NEW.nesting_level, OLD.nesting_level),
            metadata_val
        );
    END IF;

    -- Send real-time notification
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify('new_comment',
            json_build_object(
                'comment_id', NEW.id,
                'content_type', NEW.content_type,
                'content_id', NEW.content_id,
                'user_id', NEW.user_id,
                'parent_id', NEW.parent_id
            )::text
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for comment events
CREATE TRIGGER track_comment_events_trigger
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION track_comment_event();

-- Function to track comment like events
CREATE OR REPLACE FUNCTION track_comment_like_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update denormalized counters
        IF NEW.like_type = 1 THEN
            UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
        ELSE
            UPDATE comments SET dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
        END IF;

        -- Send real-time notification
        PERFORM pg_notify('comment_liked',
            json_build_object(
                'comment_id', NEW.comment_id,
                'user_id', NEW.user_id,
                'like_type', NEW.like_type
            )::text
        );
    ELSIF TG_OP = 'DELETE' THEN
        -- Update denormalized counters
        IF OLD.like_type = 1 THEN
            UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
        ELSE
            UPDATE comments SET dislike_count = dislike_count - 1 WHERE id = OLD.comment_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_comment_like_events_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION track_comment_like_event();

-- ===============================================================
-- SECTION 10: DATA RETENTION POLICIES
-- ===============================================================

-- Enable compression and set policies for comment events
ALTER TABLE comment_events SET (timescaledb.compress, timescaledb.compress_orderby = 'time DESC', timescaledb.compress_segmentby = 'content_id');
SELECT add_retention_policy('comment_events', INTERVAL '1 year');
SELECT add_compression_policy('comment_events', INTERVAL '1 week');

-- Enable compression and set policies for watch party events
ALTER TABLE watch_party_events SET (timescaledb.compress, timescaledb.compress_orderby = 'time DESC', timescaledb.compress_segmentby = 'room_id');
SELECT add_retention_policy('watch_party_events', INTERVAL '6 months');
SELECT add_compression_policy('watch_party_events', INTERVAL '3 days');

-- Enable compression and set policies for notification events
ALTER TABLE notification_events SET (timescaledb.compress, timescaledb.compress_orderby = 'time DESC', timescaledb.compress_segmentby = 'user_id');
SELECT add_retention_policy('notification_events', INTERVAL '3 months');
SELECT add_compression_policy('notification_events', INTERVAL '1 day');

-- Enable compression and set policies for user activity events
ALTER TABLE user_activity_events SET (timescaledb.compress, timescaledb.compress_orderby = 'time DESC', timescaledb.compress_segmentby = 'user_id');
SELECT add_retention_policy('user_activity_events', INTERVAL '1 year');
SELECT add_compression_policy('user_activity_events', INTERVAL '1 week');

-- ===============================================================
-- SECTION 11: TIME-SERIES INDEXES
-- ===============================================================

-- Time-series optimized indexes
CREATE INDEX IF NOT EXISTS idx_comment_events_content ON comment_events (content_type, content_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_comment_events_user_time ON comment_events (user_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_comment_events_type_time ON comment_events (event_type, time DESC);

CREATE INDEX IF NOT EXISTS idx_watch_party_events_room_time ON watch_party_events (room_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_watch_party_events_type_time ON watch_party_events (event_type, time DESC);

CREATE INDEX IF NOT EXISTS idx_notification_events_user_time ON notification_events (user_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_delivery ON notification_events (delivery_method, event_type, time DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_events_user_time ON user_activity_events (user_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_events_activity_time ON user_activity_events (activity_type, time DESC);

-- ===============================================================
-- SECTION 12: REDIS CACHING STRATEGY DOCUMENTATION
-- ===============================================================

/*
REDIS CACHING STRATEGY FOR COMMUNITY SERVICE

Cache Keys Pattern:
- comments:hot:{content_type}:{content_id} - Top liked comments (TTL: 1h)
- comments:recent:{content_type}:{content_id} - Latest comments (TTL: 1h)
- comments:count:{content_type}:{content_id} - Comment count (TTL: 1h)
- reviews:summary:{content_type}:{content_id} - Review aggregations (TTL: 1h)
- watchlist:user:{user_id} - User's complete watchlist (TTL: 1h)
- watchlist:stats:{content_type}:{content_id} - Content watchlist stats (TTL: 1h)
- notifications:unread:{user_id} - Unread notification count (TTL: 5m)
- watch_party:active - List of active rooms (TTL: 30s)

Cache Invalidation Triggers:
- comments:* -> Invalidate on comment CREATE/UPDATE/DELETE/LIKE
- reviews:* -> Invalidate on review CREATE/UPDATE/DELETE
- watchlist:* -> Invalidate on watchlist status change
- notifications:* -> Invalidate on notification CREATE/READ

Cache Warming Strategy:
- Pre-warm popular content comments/reviews during off-peak hours
- Use Redis Pipeline for batch operations
- Implement cache-aside pattern for read operations

Performance Considerations:
- Use Redis Sorted Sets for comment ranking by likes/date
- Use Redis Hash for user watchlist storage
- Use Redis Pub/Sub for real-time notifications
- Use Redis Streams for watch party real-time events
*/

COMMIT;