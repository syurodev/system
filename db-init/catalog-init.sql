-- =================================================================
--        CATALOG SERVICE DATABASE SCHEMA - SELF-DOCUMENTING
-- =================================================================
-- This script contains the complete schema for the Catalog Service.
-- It manages all content types (Novel, Manga, Anime), their metadata,
-- characters, creators, taxonomy, and pricing information.
-- Uses the `COMMENT ON` command to embed documentation directly
-- into the database schema.
-- =================================================================

BEGIN;

-- Kích hoạt extension pgcrypto để dùng gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===============================================================
-- SECTION 1: TAXONOMY SYSTEM (Shared Classification)
-- ===============================================================

-- 1) GENRES
CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE genres IS 'Bảng định nghĩa các thể loại chung cho tất cả loại content (Action, Romance, Comedy, etc.)';
COMMENT ON COLUMN genres.id IS 'ID của thể loại (Primary Key)';
COMMENT ON COLUMN genres.name IS 'Tên thể loại hiển thị (ví dụ: "Action")';
COMMENT ON COLUMN genres.slug IS 'Slug URL-friendly (ví dụ: "action")';
COMMENT ON COLUMN genres.description IS 'Mô tả chi tiết về thể loại';
COMMENT ON COLUMN genres.created_at IS 'Thời điểm thể loại được tạo';

-- 2) TAGS
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tags IS 'Bảng định nghĩa các thẻ bổ sung (School Life, Harem, Time Travel, etc.)';
COMMENT ON COLUMN tags.id IS 'ID của thẻ (Primary Key)';
COMMENT ON COLUMN tags.name IS 'Tên thẻ hiển thị (ví dụ: "School Life")';
COMMENT ON COLUMN tags.slug IS 'Slug URL-friendly (ví dụ: "school-life")';
COMMENT ON COLUMN tags.created_at IS 'Thời điểm thẻ được tạo';

-- 3) CLASSIFICATIONS (Polymorphic Junction Table)
CREATE TABLE IF NOT EXISTS classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel', 'manga', 'anime')),
    content_id UUID NOT NULL,
    classification_type VARCHAR(10) NOT NULL CHECK (classification_type IN ('genre', 'tag')),
    classification_id INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE classifications IS 'Bảng nối đa hình để gán thể loại/thẻ cho bất kỳ loại content nào';
COMMENT ON COLUMN classifications.content_type IS 'Loại content (novel/manga/anime)';
COMMENT ON COLUMN classifications.content_id IS 'ID của content (novels.id, mangas.id, hoặc animes.id)';
COMMENT ON COLUMN classifications.classification_type IS 'Loại phân loại (genre hoặc tag)';
COMMENT ON COLUMN classifications.classification_id IS 'ID của genre hoặc tag tương ứng';
COMMENT ON COLUMN classifications.created_at IS 'Thời điểm phân loại được gán';

-- ===============================================================
-- SECTION 2: CREATORS & ARTISTS SYSTEM
-- ===============================================================

-- 4) CREATORS
CREATE TABLE IF NOT EXISTS creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    birth_date DATE,
    nationality VARCHAR(50),
    website_url TEXT,
    twitter_handle VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE creators IS 'Bảng trung tâm lưu trữ thông tin về tác giả, họa sĩ, đạo diễn';
COMMENT ON COLUMN creators.id IS 'ID của người sáng tạo (Primary Key)';
COMMENT ON COLUMN creators.name IS 'Tên thật hoặc bút danh của người sáng tạo';
COMMENT ON COLUMN creators.slug IS 'Slug URL-friendly cho trang cá nhân';
COMMENT ON COLUMN creators.bio IS 'Tiểu sử hoặc mô tả về người sáng tạo';
COMMENT ON COLUMN creators.avatar_url IS 'URL ảnh đại diện (S3)';
COMMENT ON COLUMN creators.birth_date IS 'Ngày sinh (có thể null nếu không công khai)';
COMMENT ON COLUMN creators.nationality IS 'Quốc tịch';
COMMENT ON COLUMN creators.website_url IS 'Website cá nhân';
COMMENT ON COLUMN creators.twitter_handle IS 'Tên Twitter handle (không có @)';
COMMENT ON COLUMN creators.created_at IS 'Thời điểm được tạo trong hệ thống';
COMMENT ON COLUMN creators.updated_at IS 'Thời điểm thông tin được cập nhật lần cuối';

-- 5) CONTENT_CREATORS (Polymorphic Junction Table)
CREATE TABLE IF NOT EXISTS content_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel', 'manga', 'anime')),
    content_id UUID NOT NULL,
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('author', 'illustrator', 'original_creator', 'character_designer', 'director', 'writer', 'studio')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE content_creators IS 'Bảng nối đa hình liên kết content với creators theo vai trò cụ thể';
COMMENT ON COLUMN content_creators.content_type IS 'Loại content (novel/manga/anime)';
COMMENT ON COLUMN content_creators.content_id IS 'ID của content';
COMMENT ON COLUMN content_creators.creator_id IS 'ID của người sáng tạo';
COMMENT ON COLUMN content_creators.role IS 'Vai trò: author (tác giả), illustrator (họa sĩ), director (đạo diễn), etc.';
COMMENT ON COLUMN content_creators.created_at IS 'Thời điểm liên kết được tạo';

-- ===============================================================
-- SECTION 3: CHARACTER DATABASE SYSTEM
-- ===============================================================

-- 6) CHARACTERS
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    main_image_url TEXT,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unknown', 'other')),
    age_range VARCHAR(20),
    personality_traits JSONB DEFAULT '[]',
    physical_description TEXT,
    background_story TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE characters IS 'Bảng trung tâm chứa thông tin chi tiết về các nhân vật';
COMMENT ON COLUMN characters.id IS 'ID của nhân vật (Primary Key)';
COMMENT ON COLUMN characters.name IS 'Tên chính của nhân vật';
COMMENT ON COLUMN characters.slug IS 'Slug URL-friendly cho trang nhân vật';
COMMENT ON COLUMN characters.description IS 'Mô tả tổng quan về nhân vật (không spoiler)';
COMMENT ON COLUMN characters.main_image_url IS 'URL ảnh đại diện chính của nhân vật (S3)';
COMMENT ON COLUMN characters.gender IS 'Giới tính của nhân vật';
COMMENT ON COLUMN characters.age_range IS 'Độ tuổi (ví dụ: "16-17", "Unknown")';
COMMENT ON COLUMN characters.personality_traits IS 'Array JSON chứa các đặc điểm tính cách ["brave", "kind"]';
COMMENT ON COLUMN characters.physical_description IS 'Mô tả ngoại hình';
COMMENT ON COLUMN characters.background_story IS 'Câu chuyện nền (có thể chứa spoiler)';
COMMENT ON COLUMN characters.metadata IS 'Thông tin metadata mở rộng (JSONB)';
COMMENT ON COLUMN characters.created_at IS 'Thời điểm nhân vật được tạo';
COMMENT ON COLUMN characters.updated_at IS 'Thời điểm thông tin được cập nhật lần cuối';

-- 7) CHARACTER_APPEARANCES (Polymorphic Junction Table)
CREATE TABLE IF NOT EXISTS character_appearances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel', 'manga', 'anime')),
    content_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('main', 'supporting', 'minor')),
    contextual_image_url TEXT,
    first_appearance_info JSONB,
    character_notes TEXT,
    is_spoiler BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE character_appearances IS 'Bảng liên kết nhân vật với các content, hỗ trợ cross-media discovery';
COMMENT ON COLUMN character_appearances.character_id IS 'ID của nhân vật';
COMMENT ON COLUMN character_appearances.content_type IS 'Loại content mà nhân vật xuất hiện (novel/manga/anime)';
COMMENT ON COLUMN character_appearances.content_id IS 'ID của content';
COMMENT ON COLUMN character_appearances.role IS 'Vai trò trong content: main (chính), supporting (phụ), minor (cameo)';
COMMENT ON COLUMN character_appearances.contextual_image_url IS 'Ảnh của nhân vật trong context cụ thể (S3)';
COMMENT ON COLUMN character_appearances.first_appearance_info IS 'Thông tin xuất hiện đầu tiên {"chapter": 1, "episode": 3}';
COMMENT ON COLUMN character_appearances.character_notes IS 'Ghi chú về nhân vật trong content cụ thể';
COMMENT ON COLUMN character_appearances.is_spoiler IS 'Đánh dấu thông tin có chứa spoiler không';
COMMENT ON COLUMN character_appearances.created_at IS 'Thời điểm liên kết được tạo';

-- ===============================================================
-- SECTION 4: NOVEL SYSTEM
-- ===============================================================

-- 8) NOVELS
CREATE TABLE IF NOT EXISTS novels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL, -- References teams.id from Account Service
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    status SMALLINT NOT NULL DEFAULT 0, -- 0=Ongoing, 1=Completed, 2=Hiatus, 3=Cancelled
    publication_status SMALLINT NOT NULL DEFAULT 0, -- 0=Web Novel, 1=Light Novel, 2=Published Book
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    original_language VARCHAR(10),
    is_original BOOLEAN NOT NULL DEFAULT TRUE,
    mature_content BOOLEAN NOT NULL DEFAULT FALSE,
    total_volumes INT DEFAULT 0,
    total_chapters INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE novels IS 'Bảng chính chứa thông tin về các tác phẩm novel';
COMMENT ON COLUMN novels.id IS 'ID của novel (Primary Key)';
COMMENT ON COLUMN novels.team_id IS 'ID của nhóm sáng tạo sở hữu (reference tới Account Service)';
COMMENT ON COLUMN novels.title IS 'Tiêu đề chính của novel';
COMMENT ON COLUMN novels.slug IS 'Slug URL-friendly';
COMMENT ON COLUMN novels.description IS 'Mô tả/tóm tắt nội dung';
COMMENT ON COLUMN novels.cover_image_url IS 'URL ảnh bìa (S3)';
COMMENT ON COLUMN novels.status IS 'Trạng thái: 0=Đang tiến hành, 1=Hoàn thành, 2=Tạm ngưng, 3=Hủy bỏ';
COMMENT ON COLUMN novels.publication_status IS 'Loại xuất bản: 0=Web Novel, 1=Light Novel, 2=Sách xuất bản';
COMMENT ON COLUMN novels.language IS 'Ngôn ngữ hiện tại (vi, en, jp, etc.)';
COMMENT ON COLUMN novels.original_language IS 'Ngôn ngữ gốc (nếu là bản dịch)';
COMMENT ON COLUMN novels.is_original IS 'True nếu là tác phẩm gốc, False nếu là bản dịch';
COMMENT ON COLUMN novels.mature_content IS 'Có chứa nội dung người lớn không';
COMMENT ON COLUMN novels.total_volumes IS 'Tổng số volume (được cập nhật tự động)';
COMMENT ON COLUMN novels.total_chapters IS 'Tổng số chapter (được cập nhật tự động)';
COMMENT ON COLUMN novels.average_rating IS 'Điểm đánh giá trung bình (1.00-5.00)';
COMMENT ON COLUMN novels.total_ratings IS 'Tổng số lượt đánh giá';
COMMENT ON COLUMN novels.view_count IS 'Tổng số lượt xem';
COMMENT ON COLUMN novels.favorite_count IS 'Số lượt yêu thích';
COMMENT ON COLUMN novels.metadata IS 'Metadata mở rộng (awards, external_links, etc.)';
COMMENT ON COLUMN novels.created_at IS 'Thời điểm novel được tạo';
COMMENT ON COLUMN novels.updated_at IS 'Thời điểm thông tin được cập nhật lần cuối';

-- 9) NOVEL_ALIASES
CREATE TABLE IF NOT EXISTS novel_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    alias_title VARCHAR(255) NOT NULL,
    alias_type VARCHAR(20) NOT NULL CHECK (alias_type IN ('alternative', 'english', 'romanized', 'abbreviated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE novel_aliases IS 'Bảng lưu trữ các tên gọi thay thế của novel';
COMMENT ON COLUMN novel_aliases.novel_id IS 'ID của novel';
COMMENT ON COLUMN novel_aliases.alias_title IS 'Tên gọi thay thế';
COMMENT ON COLUMN novel_aliases.alias_type IS 'Loại alias: alternative, english, romanized, abbreviated';
COMMENT ON COLUMN novel_aliases.created_at IS 'Thời điểm alias được tạo';

-- 10) NOVEL_VOLUMES
CREATE TABLE IF NOT EXISTS novel_volumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    volume_number INT NOT NULL,
    title VARCHAR(255),
    cover_image_url TEXT,
    description TEXT,
    chapter_count INT DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 0, -- 0=Ongoing, 1=Completed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(novel_id, volume_number)
);

COMMENT ON TABLE novel_volumes IS 'Bảng quản lý các tập/volume của novel';
COMMENT ON COLUMN novel_volumes.novel_id IS 'ID của novel cha';
COMMENT ON COLUMN novel_volumes.volume_number IS 'Số thứ tự volume (bắt đầu từ 1)';
COMMENT ON COLUMN novel_volumes.title IS 'Tiêu đề của volume (có thể null)';
COMMENT ON COLUMN novel_volumes.cover_image_url IS 'URL ảnh bìa volume riêng (S3)';
COMMENT ON COLUMN novel_volumes.description IS 'Mô tả nội dung volume';
COMMENT ON COLUMN novel_volumes.chapter_count IS 'Số chapter trong volume (tự động cập nhật)';
COMMENT ON COLUMN novel_volumes.status IS 'Trạng thái volume: 0=Đang tiến hành, 1=Hoàn thành';
COMMENT ON COLUMN novel_volumes.created_at IS 'Thời điểm volume được tạo';
COMMENT ON COLUMN novel_volumes.updated_at IS 'Thời điểm volume được cập nhật lần cuối';

-- 11) NOVEL_CHAPTERS
CREATE TABLE IF NOT EXISTS novel_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    volume_id UUID NOT NULL REFERENCES novel_volumes(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title VARCHAR(255),
    content_s3_url TEXT NOT NULL,
    word_count INT DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    early_access_until TIMESTAMPTZ,
    view_count BIGINT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(novel_id, chapter_number)
);

COMMENT ON TABLE novel_chapters IS 'Bảng lưu trữ các chapter của novel';
COMMENT ON COLUMN novel_chapters.novel_id IS 'ID của novel cha';
COMMENT ON COLUMN novel_chapters.volume_id IS 'ID của volume chứa chapter';
COMMENT ON COLUMN novel_chapters.chapter_number IS 'Số thứ tự chapter trong toàn bộ novel';
COMMENT ON COLUMN novel_chapters.title IS 'Tiêu đề chapter';
COMMENT ON COLUMN novel_chapters.content_s3_url IS 'URL file nội dung text trên S3';
COMMENT ON COLUMN novel_chapters.word_count IS 'Số từ trong chapter';
COMMENT ON COLUMN novel_chapters.is_premium IS 'Chapter có yêu cầu trả phí không';
COMMENT ON COLUMN novel_chapters.early_access_until IS 'Thời điểm hết early access (cho Premium users)';
COMMENT ON COLUMN novel_chapters.view_count IS 'Số lượt đọc';
COMMENT ON COLUMN novel_chapters.like_count IS 'Số lượt thích';
COMMENT ON COLUMN novel_chapters.comment_count IS 'Số bình luận';
COMMENT ON COLUMN novel_chapters.published_at IS 'Thời điểm chapter được publish';
COMMENT ON COLUMN novel_chapters.created_at IS 'Thời điểm chapter được tạo';
COMMENT ON COLUMN novel_chapters.updated_at IS 'Thời điểm chapter được cập nhật lần cuối';

-- ===============================================================
-- SECTION 5: MANGA SYSTEM
-- ===============================================================

-- 12) MANGAS
CREATE TABLE IF NOT EXISTS mangas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL, -- References teams.id from Account Service
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    status SMALLINT NOT NULL DEFAULT 0, -- 0=Ongoing, 1=Completed, 2=Hiatus, 3=Cancelled
    publication_type SMALLINT NOT NULL DEFAULT 0, -- 0=Manga, 1=Manhwa, 2=Manhua, 3=Webtoon
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    original_language VARCHAR(10),
    is_original BOOLEAN NOT NULL DEFAULT TRUE,
    mature_content BOOLEAN NOT NULL DEFAULT FALSE,
    reading_direction SMALLINT NOT NULL DEFAULT 0, -- 0=Right-to-Left, 1=Left-to-Right, 2=Top-to-Bottom
    is_colored BOOLEAN NOT NULL DEFAULT FALSE,
    total_volumes INT DEFAULT 0,
    total_chapters INT DEFAULT 0,
    total_pages INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE mangas IS 'Bảng chính chứa thông tin về các tác phẩm manga/manhwa/webtoon';
COMMENT ON COLUMN mangas.id IS 'ID của manga (Primary Key)';
COMMENT ON COLUMN mangas.team_id IS 'ID của nhóm sáng tạo sở hữu (reference tới Account Service)';
COMMENT ON COLUMN mangas.title IS 'Tiêu đề chính của manga';
COMMENT ON COLUMN mangas.slug IS 'Slug URL-friendly';
COMMENT ON COLUMN mangas.description IS 'Mô tả/tóm tắt nội dung';
COMMENT ON COLUMN mangas.cover_image_url IS 'URL ảnh bìa (S3)';
COMMENT ON COLUMN mangas.status IS 'Trạng thái: 0=Đang tiến hành, 1=Hoàn thành, 2=Tạm ngưng, 3=Hủy bỏ';
COMMENT ON COLUMN mangas.publication_type IS 'Loại: 0=Manga (Nhật), 1=Manhwa (Hàn), 2=Manhua (Trung), 3=Webtoon';
COMMENT ON COLUMN mangas.language IS 'Ngôn ngữ hiện tại (vi, en, jp, etc.)';
COMMENT ON COLUMN mangas.original_language IS 'Ngôn ngữ gốc (nếu là bản dịch)';
COMMENT ON COLUMN mangas.is_original IS 'True nếu là tác phẩm gốc, False nếu là bản dịch';
COMMENT ON COLUMN mangas.mature_content IS 'Có chứa nội dung người lớn không';
COMMENT ON COLUMN mangas.reading_direction IS 'Hướng đọc: 0=Phải sang trái, 1=Trái sang phải, 2=Trên xuống dưới';
COMMENT ON COLUMN mangas.is_colored IS 'Manga có màu hay đen trắng';
COMMENT ON COLUMN mangas.total_volumes IS 'Tổng số volume (được cập nhật tự động)';
COMMENT ON COLUMN mangas.total_chapters IS 'Tổng số chapter (được cập nhật tự động)';
COMMENT ON COLUMN mangas.total_pages IS 'Tổng số page (được cập nhật tự động)';
COMMENT ON COLUMN mangas.average_rating IS 'Điểm đánh giá trung bình (1.00-5.00)';
COMMENT ON COLUMN mangas.total_ratings IS 'Tổng số lượt đánh giá';
COMMENT ON COLUMN mangas.view_count IS 'Tổng số lượt xem';
COMMENT ON COLUMN mangas.favorite_count IS 'Số lượt yêu thích';
COMMENT ON COLUMN mangas.metadata IS 'Metadata mở rộng (serialization, awards, etc.)';
COMMENT ON COLUMN mangas.created_at IS 'Thời điểm manga được tạo';
COMMENT ON COLUMN mangas.updated_at IS 'Thời điểm thông tin được cập nhật lần cuối';

-- 13) MANGA_ALIASES
CREATE TABLE IF NOT EXISTS manga_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    alias_title VARCHAR(255) NOT NULL,
    alias_type VARCHAR(20) NOT NULL CHECK (alias_type IN ('alternative', 'english', 'romanized', 'abbreviated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE manga_aliases IS 'Bảng lưu trữ các tên gọi thay thế của manga';
COMMENT ON COLUMN manga_aliases.manga_id IS 'ID của manga';
COMMENT ON COLUMN manga_aliases.alias_title IS 'Tên gọi thay thế';
COMMENT ON COLUMN manga_aliases.alias_type IS 'Loại alias: alternative, english, romanized, abbreviated';
COMMENT ON COLUMN manga_aliases.created_at IS 'Thời điểm alias được tạo';

-- 14) MANGA_VOLUMES
CREATE TABLE IF NOT EXISTS manga_volumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    volume_number INT NOT NULL,
    title VARCHAR(255),
    cover_image_url TEXT,
    description TEXT,
    chapter_count INT DEFAULT 0,
    page_count INT DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 0, -- 0=Ongoing, 1=Completed
    is_auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(manga_id, volume_number)
);

COMMENT ON TABLE manga_volumes IS 'Bảng quản lý các tập/volume của manga';
COMMENT ON COLUMN manga_volumes.manga_id IS 'ID của manga cha';
COMMENT ON COLUMN manga_volumes.volume_number IS 'Số thứ tự volume (bắt đầu từ 1)';
COMMENT ON COLUMN manga_volumes.title IS 'Tiêu đề của volume (có thể null)';
COMMENT ON COLUMN manga_volumes.cover_image_url IS 'URL ảnh bìa volume riêng (S3)';
COMMENT ON COLUMN manga_volumes.description IS 'Mô tả nội dung volume';
COMMENT ON COLUMN manga_volumes.chapter_count IS 'Số chapter trong volume (tự động cập nhật)';
COMMENT ON COLUMN manga_volumes.page_count IS 'Số page trong volume (tự động cập nhật)';
COMMENT ON COLUMN manga_volumes.status IS 'Trạng thái volume: 0=Đang tiến hành, 1=Hoàn thành';
COMMENT ON COLUMN manga_volumes.is_auto_generated IS 'Volume được tạo tự động cho webtoon (không có volume chính thức)';
COMMENT ON COLUMN manga_volumes.created_at IS 'Thời điểm volume được tạo';
COMMENT ON COLUMN manga_volumes.updated_at IS 'Thời điểm volume được cập nhật lần cuối';

-- 15) MANGA_CHAPTERS
CREATE TABLE IF NOT EXISTS manga_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    volume_id UUID NOT NULL REFERENCES manga_volumes(id) ON DELETE CASCADE,
    chapter_number DECIMAL(6,2) NOT NULL, -- Supports 123.5, 456.1 for special chapters
    title VARCHAR(255),
    page_count INT DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    early_access_until TIMESTAMPTZ,
    view_count BIGINT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(manga_id, chapter_number)
);

COMMENT ON TABLE manga_chapters IS 'Bảng lưu trữ các chapter của manga';
COMMENT ON COLUMN manga_chapters.manga_id IS 'ID của manga cha';
COMMENT ON COLUMN manga_chapters.volume_id IS 'ID của volume chứa chapter';
COMMENT ON COLUMN manga_chapters.chapter_number IS 'Số thứ tự chapter (hỗ trợ decimal cho chapter đặc biệt)';
COMMENT ON COLUMN manga_chapters.title IS 'Tiêu đề chapter';
COMMENT ON COLUMN manga_chapters.page_count IS 'Số page trong chapter (tự động cập nhật)';
COMMENT ON COLUMN manga_chapters.is_premium IS 'Chapter có yêu cầu trả phí không';
COMMENT ON COLUMN manga_chapters.early_access_until IS 'Thời điểm hết early access (cho Premium users)';
COMMENT ON COLUMN manga_chapters.view_count IS 'Số lượt đọc';
COMMENT ON COLUMN manga_chapters.like_count IS 'Số lượt thích';
COMMENT ON COLUMN manga_chapters.comment_count IS 'Số bình luận';
COMMENT ON COLUMN manga_chapters.published_at IS 'Thời điểm chapter được publish';
COMMENT ON COLUMN manga_chapters.created_at IS 'Thời điểm chapter được tạo';
COMMENT ON COLUMN manga_chapters.updated_at IS 'Thời điểm chapter được cập nhật lần cuối';

-- 16) MANGA_PAGES
CREATE TABLE IF NOT EXISTS manga_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES manga_chapters(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    image_s3_url TEXT NOT NULL,
    image_width INT,
    image_height INT,
    file_size_bytes BIGINT,
    image_format VARCHAR(10), -- webp, jpg, png
    alt_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(chapter_id, page_number)
);

COMMENT ON TABLE manga_pages IS 'Bảng lưu trữ từng trang hình ảnh của manga chapter (cần thiết cho bookmark function)';
COMMENT ON COLUMN manga_pages.id IS 'ID của page (Primary Key) - cần thiết cho bookmark reference';
COMMENT ON COLUMN manga_pages.chapter_id IS 'ID của chapter chứa page';
COMMENT ON COLUMN manga_pages.page_number IS 'Số thứ tự page trong chapter (bắt đầu từ 1)';
COMMENT ON COLUMN manga_pages.image_s3_url IS 'URL hình ảnh trên S3';
COMMENT ON COLUMN manga_pages.image_width IS 'Chiều rộng ảnh (px)';
COMMENT ON COLUMN manga_pages.image_height IS 'Chiều cao ảnh (px)';
COMMENT ON COLUMN manga_pages.file_size_bytes IS 'Kích thước file (bytes)';
COMMENT ON COLUMN manga_pages.image_format IS 'Định dạng ảnh (webp, jpg, png)';
COMMENT ON COLUMN manga_pages.alt_text IS 'Text mô tả ảnh cho accessibility';
COMMENT ON COLUMN manga_pages.created_at IS 'Thời điểm page được tạo';

-- ===============================================================
-- SECTION 6: ANIME SYSTEM
-- ===============================================================

-- 17) ANIMES
CREATE TABLE IF NOT EXISTS animes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL, -- References teams.id from Account Service
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    trailer_s3_url TEXT,
    status SMALLINT NOT NULL DEFAULT 0, -- 0=Ongoing, 1=Completed, 2=Hiatus, 3=Cancelled
    anime_type SMALLINT NOT NULL DEFAULT 0, -- 0=TV Series, 1=Movie, 2=OVA, 3=ONA, 4=Special
    broadcast_season VARCHAR(20), -- "Spring 2024", "Fall 2023"
    broadcast_year INT,
    broadcast_day_of_week SMALLINT, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    broadcast_time TIME,
    episode_duration_minutes INT DEFAULT 24,
    total_seasons INT DEFAULT 0,
    total_episodes INT DEFAULT 0,
    language VARCHAR(10) NOT NULL DEFAULT 'jp',
    has_subtitles BOOLEAN NOT NULL DEFAULT TRUE,
    has_dub BOOLEAN NOT NULL DEFAULT FALSE,
    mature_content BOOLEAN NOT NULL DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE animes IS 'Bảng chính chứa thông tin về các tác phẩm anime';
COMMENT ON COLUMN animes.id IS 'ID của anime (Primary Key)';
COMMENT ON COLUMN animes.team_id IS 'ID của nhóm sáng tạo sở hữu (reference tới Account Service)';
COMMENT ON COLUMN animes.title IS 'Tiêu đề chính của anime';
COMMENT ON COLUMN animes.slug IS 'Slug URL-friendly';
COMMENT ON COLUMN animes.description IS 'Mô tả/tóm tắt nội dung';
COMMENT ON COLUMN animes.cover_image_url IS 'URL ảnh poster (S3)';
COMMENT ON COLUMN animes.trailer_s3_url IS 'URL video trailer (S3)';
COMMENT ON COLUMN animes.status IS 'Trạng thái: 0=Đang tiến hành, 1=Hoàn thành, 2=Tạm ngưng, 3=Hủy bỏ';
COMMENT ON COLUMN animes.anime_type IS 'Loại: 0=TV Series, 1=Movie, 2=OVA, 3=ONA, 4=Special';
COMMENT ON COLUMN animes.broadcast_season IS 'Mùa phát sóng (Spring 2024, Fall 2023)';
COMMENT ON COLUMN animes.broadcast_year IS 'Năm phát sóng';
COMMENT ON COLUMN animes.broadcast_day_of_week IS 'Ngày trong tuần phát sóng (0=CN, 1=T2, ..., 6=T7)';
COMMENT ON COLUMN animes.broadcast_time IS 'Giờ phát sóng';
COMMENT ON COLUMN animes.episode_duration_minutes IS 'Thời lượng trung bình mỗi tập (phút)';
COMMENT ON COLUMN animes.total_seasons IS 'Tổng số season (được cập nhật tự động)';
COMMENT ON COLUMN animes.total_episodes IS 'Tổng số episode (được cập nhật tự động)';
COMMENT ON COLUMN animes.language IS 'Ngôn ngữ gốc (jp, en, etc.)';
COMMENT ON COLUMN animes.has_subtitles IS 'Có phụ đề không';
COMMENT ON COLUMN animes.has_dub IS 'Có lồng tiếng không';
COMMENT ON COLUMN animes.mature_content IS 'Có chứa nội dung người lớn không';
COMMENT ON COLUMN animes.average_rating IS 'Điểm đánh giá trung bình (1.00-5.00)';
COMMENT ON COLUMN animes.total_ratings IS 'Tổng số lượt đánh giá';
COMMENT ON COLUMN animes.view_count IS 'Tổng số lượt xem';
COMMENT ON COLUMN animes.favorite_count IS 'Số lượt yêu thích';
COMMENT ON COLUMN animes.metadata IS 'Metadata mở rộng (mal_id, anilist_id, etc.)';
COMMENT ON COLUMN animes.created_at IS 'Thời điểm anime được tạo';
COMMENT ON COLUMN animes.updated_at IS 'Thời điểm thông tin được cập nhật lần cuối';

-- 18) ANIME_ALIASES
CREATE TABLE IF NOT EXISTS anime_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id UUID NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    alias_title VARCHAR(255) NOT NULL,
    alias_type VARCHAR(20) NOT NULL CHECK (alias_type IN ('alternative', 'english', 'romanized', 'abbreviated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE anime_aliases IS 'Bảng lưu trữ các tên gọi thay thế của anime';
COMMENT ON COLUMN anime_aliases.anime_id IS 'ID của anime';
COMMENT ON COLUMN anime_aliases.alias_title IS 'Tên gọi thay thế';
COMMENT ON COLUMN anime_aliases.alias_type IS 'Loại alias: alternative, english, romanized, abbreviated';
COMMENT ON COLUMN anime_aliases.created_at IS 'Thời điểm alias được tạo';

-- 19) ANIME_SEASONS
CREATE TABLE IF NOT EXISTS anime_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id UUID NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    season_number INT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    cover_image_url TEXT,
    episode_count INT DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 0, -- 0=Ongoing, 1=Completed
    air_start_date DATE,
    air_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(anime_id, season_number)
);

COMMENT ON TABLE anime_seasons IS 'Bảng quản lý các season của anime';
COMMENT ON COLUMN anime_seasons.anime_id IS 'ID của anime cha';
COMMENT ON COLUMN anime_seasons.season_number IS 'Số thứ tự season (bắt đầu từ 1)';
COMMENT ON COLUMN anime_seasons.title IS 'Tiêu đề của season (ví dụ: "Season 2", "Final Season")';
COMMENT ON COLUMN anime_seasons.description IS 'Mô tả nội dung season';
COMMENT ON COLUMN anime_seasons.cover_image_url IS 'URL ảnh poster season riêng (S3)';
COMMENT ON COLUMN anime_seasons.episode_count IS 'Số episode trong season (tự động cập nhật)';
COMMENT ON COLUMN anime_seasons.status IS 'Trạng thái season: 0=Đang tiến hành, 1=Hoàn thành';
COMMENT ON COLUMN anime_seasons.air_start_date IS 'Ngày bắt đầu phát sóng';
COMMENT ON COLUMN anime_seasons.air_end_date IS 'Ngày kết thúc phát sóng';
COMMENT ON COLUMN anime_seasons.created_at IS 'Thời điểm season được tạo';
COMMENT ON COLUMN anime_seasons.updated_at IS 'Thời điểm season được cập nhật lần cuối';

-- 20) ANIME_EPISODES
CREATE TABLE IF NOT EXISTS anime_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id UUID NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES anime_seasons(id) ON DELETE CASCADE,
    episode_number DECIMAL(6,2) NOT NULL, -- Supports 12.5 for special episodes
    title VARCHAR(255),
    description TEXT,
    thumbnail_s3_url TEXT,
    video_s3_url TEXT NOT NULL,
    subtitle_s3_urls JSONB DEFAULT '{}', -- {"en": "s3://...", "vi": "s3://..."}
    duration_seconds INT,
    intro_start_seconds INT, -- For skip intro feature
    intro_end_seconds INT,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    early_access_until TIMESTAMPTZ,
    view_count BIGINT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    air_date DATE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(anime_id, episode_number)
);

COMMENT ON TABLE anime_episodes IS 'Bảng lưu trữ các episode của anime';
COMMENT ON COLUMN anime_episodes.anime_id IS 'ID của anime cha';
COMMENT ON COLUMN anime_episodes.season_id IS 'ID của season chứa episode';
COMMENT ON COLUMN anime_episodes.episode_number IS 'Số thứ tự episode (hỗ trợ decimal cho episode đặc biệt)';
COMMENT ON COLUMN anime_episodes.title IS 'Tiêu đề episode';
COMMENT ON COLUMN anime_episodes.description IS 'Mô tả nội dung episode';
COMMENT ON COLUMN anime_episodes.thumbnail_s3_url IS 'URL ảnh thumbnail (S3)';
COMMENT ON COLUMN anime_episodes.video_s3_url IS 'URL file video chính (S3)';
COMMENT ON COLUMN anime_episodes.subtitle_s3_urls IS 'JSON object chứa URLs của file phụ đề các ngôn ngữ';
COMMENT ON COLUMN anime_episodes.duration_seconds IS 'Thời lượng episode (giây)';
COMMENT ON COLUMN anime_episodes.intro_start_seconds IS 'Thời điểm bắt đầu intro (cho tính năng skip)';
COMMENT ON COLUMN anime_episodes.intro_end_seconds IS 'Thời điểm kết thúc intro (cho tính năng skip)';
COMMENT ON COLUMN anime_episodes.is_premium IS 'Episode có yêu cầu trả phí không';
COMMENT ON COLUMN anime_episodes.early_access_until IS 'Thời điểm hết early access (cho Premium users)';
COMMENT ON COLUMN anime_episodes.view_count IS 'Số lượt xem';
COMMENT ON COLUMN anime_episodes.like_count IS 'Số lượt thích';
COMMENT ON COLUMN anime_episodes.comment_count IS 'Số bình luận';
COMMENT ON COLUMN anime_episodes.air_date IS 'Ngày phát sóng chính thức';
COMMENT ON COLUMN anime_episodes.published_at IS 'Thời điểm episode được publish trên platform';
COMMENT ON COLUMN anime_episodes.created_at IS 'Thời điểm episode được tạo';
COMMENT ON COLUMN anime_episodes.updated_at IS 'Thời điểm episode được cập nhật lần cuối';

-- 21) ANIME_SEIYUUS (Voice Actors)
CREATE TABLE IF NOT EXISTS anime_seiyuus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_japanese VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    birth_date DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unknown')),
    agency VARCHAR(100),
    website_url TEXT,
    twitter_handle VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE anime_seiyuus IS 'Bảng lưu trữ thông tin về diễn viên lồng tiếng (seiyuu)';
COMMENT ON COLUMN anime_seiyuus.id IS 'ID của seiyuu (Primary Key)';
COMMENT ON COLUMN anime_seiyuus.name IS 'Tên romanized của seiyuu';
COMMENT ON COLUMN anime_seiyuus.name_japanese IS 'Tên tiếng Nhật của seiyuu';
COMMENT ON COLUMN anime_seiyuus.slug IS 'Slug URL-friendly cho trang seiyuu';
COMMENT ON COLUMN anime_seiyuus.bio IS 'Tiểu sử seiyuu';
COMMENT ON COLUMN anime_seiyuus.avatar_url IS 'URL ảnh đại diện (S3)';
COMMENT ON COLUMN anime_seiyuus.birth_date IS 'Ngày sinh';
COMMENT ON COLUMN anime_seiyuus.gender IS 'Giới tính';
COMMENT ON COLUMN anime_seiyuus.agency IS 'Công ty quản lý';
COMMENT ON COLUMN anime_seiyuus.website_url IS 'Website cá nhân';
COMMENT ON COLUMN anime_seiyuus.twitter_handle IS 'Twitter handle (không có @)';
COMMENT ON COLUMN anime_seiyuus.created_at IS 'Thời điểm được tạo';
COMMENT ON COLUMN anime_seiyuus.updated_at IS 'Thời điểm được cập nhật lần cuối';

-- 22) CHARACTER_SEIYUUS (Character-Seiyuu relationship in specific anime)
CREATE TABLE IF NOT EXISTS character_seiyuus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    anime_id UUID NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    seiyuu_id UUID NOT NULL REFERENCES anime_seiyuus(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(character_id, anime_id)
);

COMMENT ON TABLE character_seiyuus IS 'Bảng liên kết nhân vật với seiyuu trong một anime cụ thể';
COMMENT ON COLUMN character_seiyuus.character_id IS 'ID của nhân vật';
COMMENT ON COLUMN character_seiyuus.anime_id IS 'ID của anime';
COMMENT ON COLUMN character_seiyuus.seiyuu_id IS 'ID của seiyuu lồng tiếng';
COMMENT ON COLUMN character_seiyuus.created_at IS 'Thời điểm liên kết được tạo';

-- ===============================================================
-- SECTION 7: PRICING SYSTEM (Content Monetization)
-- ===============================================================

-- 23) CONTENT_PRICING (Polymorphic pricing for all content types)
CREATE TABLE IF NOT EXISTS content_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('novel_chapter', 'novel_volume', 'novel', 'manga_chapter', 'manga_volume', 'manga', 'anime_episode', 'anime_season', 'anime')),
    content_id UUID NOT NULL,
    pricing_type VARCHAR(20) NOT NULL CHECK (pricing_type IN ('purchase', 'rental')),
    price_coins INT NOT NULL CHECK (price_coins >= 0),
    rental_duration_hours INT CHECK (
        (pricing_type = 'rental' AND rental_duration_hours IS NOT NULL AND rental_duration_hours > 0) OR
        (pricing_type = 'purchase' AND rental_duration_hours IS NULL)
    ),
    discount_percentage SMALLINT DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE content_pricing IS 'Bảng đa hình quản lý giá bán/thuê cho tất cả loại content và cấp độ';
COMMENT ON COLUMN content_pricing.id IS 'ID của pricing rule (Primary Key)';
COMMENT ON COLUMN content_pricing.content_type IS 'Loại và cấp độ content (novel_chapter, manga_volume, anime, etc.)';
COMMENT ON COLUMN content_pricing.content_id IS 'ID của content tương ứng';
COMMENT ON COLUMN content_pricing.pricing_type IS 'Loại pricing: purchase (mua vĩnh viễn) hoặc rental (thuê có thời hạn)';
COMMENT ON COLUMN content_pricing.price_coins IS 'Giá bằng coins của platform (phải >= 0)';
COMMENT ON COLUMN content_pricing.rental_duration_hours IS 'Thời hạn cho thuê (giờ), chỉ áp dụng khi pricing_type = rental';
COMMENT ON COLUMN content_pricing.discount_percentage IS 'Phần trăm giảm giá (0-100), mặc định 0';
COMMENT ON COLUMN content_pricing.is_active IS 'Pricing rule có đang hoạt động không';
COMMENT ON COLUMN content_pricing.start_date IS 'Ngày bắt đầu áp dụng pricing (null = ngay lập tức)';
COMMENT ON COLUMN content_pricing.end_date IS 'Ngày kết thúc áp dụng pricing (null = vô thời hạn)';
COMMENT ON COLUMN content_pricing.created_at IS 'Thời điểm pricing rule được tạo';
COMMENT ON COLUMN content_pricing.updated_at IS 'Thời điểm pricing rule được cập nhật lần cuối';

-- ===============================================================
-- SECTION 8: PERFORMANCE INDEXES & FULL-TEXT SEARCH
-- ===============================================================

-- Foreign Key Indexes for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_classifications_content ON classifications (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_classifications_classification ON classifications (classification_type, classification_id);
CREATE INDEX IF NOT EXISTS idx_content_creators_content ON content_creators (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_creators_creator ON content_creators (creator_id);
CREATE INDEX IF NOT EXISTS idx_character_appearances_content ON character_appearances (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_character_appearances_character ON character_appearances (character_id);

-- Content hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_novel_volumes_novel ON novel_volumes (novel_id);
CREATE INDEX IF NOT EXISTS idx_novel_chapters_novel ON novel_chapters (novel_id);
CREATE INDEX IF NOT EXISTS idx_novel_chapters_volume ON novel_chapters (volume_id);
CREATE INDEX IF NOT EXISTS idx_manga_volumes_manga ON manga_volumes (manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_chapters_manga ON manga_chapters (manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_chapters_volume ON manga_chapters (volume_id);
CREATE INDEX IF NOT EXISTS idx_manga_pages_chapter ON manga_pages (chapter_id);
CREATE INDEX IF NOT EXISTS idx_anime_seasons_anime ON anime_seasons (anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_episodes_anime ON anime_episodes (anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_episodes_season ON anime_episodes (season_id);
CREATE INDEX IF NOT EXISTS idx_character_seiyuus_character ON character_seiyuus (character_id);
CREATE INDEX IF NOT EXISTS idx_character_seiyuus_anime ON character_seiyuus (anime_id);

-- Pricing indexes
CREATE INDEX IF NOT EXISTS idx_content_pricing_content ON content_pricing (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_pricing_active ON content_pricing (is_active) WHERE is_active = true;

-- Status and filtering indexes
CREATE INDEX IF NOT EXISTS idx_novels_status ON novels (status);
CREATE INDEX IF NOT EXISTS idx_novels_team ON novels (team_id);
CREATE INDEX IF NOT EXISTS idx_mangas_status ON mangas (status);
CREATE INDEX IF NOT EXISTS idx_mangas_team ON mangas (team_id);
CREATE INDEX IF NOT EXISTS idx_animes_status ON animes (status);
CREATE INDEX IF NOT EXISTS idx_animes_team ON animes (team_id);
CREATE INDEX IF NOT EXISTS idx_animes_broadcast_season ON animes (broadcast_season, broadcast_year);

-- Published date indexes for ordering
CREATE INDEX IF NOT EXISTS idx_novel_chapters_published ON novel_chapters (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_manga_chapters_published ON manga_chapters (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_anime_episodes_published ON anime_episodes (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_anime_episodes_air_date ON anime_episodes (air_date DESC);

-- Full-Text Search indexes using GIN
CREATE INDEX IF NOT EXISTS idx_novels_fts ON novels USING GIN (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_mangas_fts ON mangas USING GIN (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_animes_fts ON animes USING GIN (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_characters_fts ON characters USING GIN (
    to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_creators_fts ON creators USING GIN (
    to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(bio, ''))
);

CREATE INDEX IF NOT EXISTS idx_anime_seiyuus_fts ON anime_seiyuus USING GIN (
    to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(name_japanese, '') || ' ' || COALESCE(bio, ''))
);

-- Alias search indexes
CREATE INDEX IF NOT EXISTS idx_novel_aliases_fts ON novel_aliases USING GIN (
    to_tsvector('simple', alias_title)
);

CREATE INDEX IF NOT EXISTS idx_manga_aliases_fts ON manga_aliases USING GIN (
    to_tsvector('simple', alias_title)
);

CREATE INDEX IF NOT EXISTS idx_anime_aliases_fts ON anime_aliases USING GIN (
    to_tsvector('simple', alias_title)
);

-- Genre and tag indexes
CREATE INDEX IF NOT EXISTS idx_genres_fts ON genres USING GIN (
    to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_tags_fts ON tags USING GIN (
    to_tsvector('simple', name)
);

COMMENT ON INDEX idx_novels_fts IS 'GIN index để tối ưu hóa Full-Text Search trên title và description của novels, sử dụng cấu hình ''simple'' để không phân biệt ngôn ngữ';
COMMENT ON INDEX idx_mangas_fts IS 'GIN index để tối ưu hóa Full-Text Search trên title và description của mangas';
COMMENT ON INDEX idx_animes_fts IS 'GIN index để tối ưu hóa Full-Text Search trên title và description của animes';
COMMENT ON INDEX idx_characters_fts IS 'GIN index để tối ưu hóa tìm kiếm nhân vật theo tên và mô tả';
COMMENT ON INDEX idx_creators_fts IS 'GIN index để tối ưu hóa tìm kiếm tác giả/họa sĩ theo tên và tiểu sử';
COMMENT ON INDEX idx_anime_seiyuus_fts IS 'GIN index để tối ưu hóa tìm kiếm seiyuu theo tên (romanized và Japanese)';

COMMIT;