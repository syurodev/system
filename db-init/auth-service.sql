-- =================================================================
--        ACCOUNT SERVICE DATABASE SCHEMA - SELF-DOCUMENTING
-- =================================================================
-- This script contains the complete schema for the Account Service.
-- It includes the required tables for Better Auth, all custom
-- business logic tables, and uses the `COMMENT ON` command to
-- embed documentation directly into the database schema.
-- =================================================================

BEGIN;

-- Kích hoạt extension pgcrypto để dùng gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===============================================================
-- SECTION 1: BETTER AUTH CORE SCHEMA
-- ===============================================================

-- 1) USERS
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT,
  username          TEXT,
  display_username  TEXT,
  email             TEXT,
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  is_anonymous      BOOLEAN NOT NULL DEFAULT FALSE,
  image             TEXT,
  metadata          JSONB DEFAULT '{}', -- Custom field
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Bảng trung tâm lưu trữ thông tin cơ bản của người dùng.';
COMMENT ON COLUMN users.id IS 'ID duy nhất cho mỗi người dùng (Primary Key)';
COMMENT ON COLUMN users.name IS 'Tên đầy đủ của người dùng (tùy chọn)';
COMMENT ON COLUMN users.username IS 'Tên đăng nhập duy nhất (ví dụ: ''johndoe'')';
COMMENT ON COLUMN users.display_username IS 'Tên hiển thị công khai, có thể khác username';
COMMENT ON COLUMN users.email IS 'Địa chỉ email duy nhất, dùng để đăng nhập và liên lạc';
COMMENT ON COLUMN users.email_verified IS 'Cờ đánh dấu email đã được xác thực hay chưa';
COMMENT ON COLUMN users.is_anonymous IS 'Cờ cho người dùng ẩn danh (tùy chọn)';
COMMENT ON COLUMN users.image IS 'URL ảnh đại diện (avatar) của người dùng';
COMMENT ON COLUMN users.bio IS 'Tiểu sử ngắn do người dùng tự viết (custom field)';
COMMENT ON COLUMN users.created_at IS 'Thời điểm tài khoản được tạo';
COMMENT ON COLUMN users.updated_at IS 'Thời điểm thông tin tài khoản được cập nhật lần cuối';

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users (LOWER(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_email_idx ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_username_idx ON users (LOWER(username)) WHERE username IS NOT NULL;


-- 2) SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token             TEXT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  ip_address        TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sessions IS 'Bảng lưu trữ các phiên đăng nhập đang hoạt động của người dùng.';
COMMENT ON COLUMN sessions.id IS 'ID của phiên đăng nhập (Primary Key)';
COMMENT ON COLUMN sessions.user_id IS 'Liên kết tới người dùng sở hữu phiên này';
COMMENT ON COLUMN sessions.token IS 'Token bí mật của phiên, dùng để xác thực';
COMMENT ON COLUMN sessions.expires_at IS 'Thời điểm phiên đăng nhập hết hạn';
COMMENT ON COLUMN sessions.ip_address IS 'Địa chỉ IP của người dùng khi tạo phiên (để bảo mật)';
COMMENT ON COLUMN sessions.user_agent IS 'Thông tin trình duyệt của người dùng (để bảo mật)';
COMMENT ON COLUMN sessions.created_at IS 'Thời điểm phiên được tạo';
COMMENT ON COLUMN sessions.updated_at IS 'Thời điểm phiên được cập nhật lần cuối';

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_unique_idx ON sessions (token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);


-- 3) ACCOUNTS
CREATE TABLE IF NOT EXISTS accounts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id                 TEXT NOT NULL,
  account_id                  TEXT NOT NULL,
  access_token                TEXT,
  refresh_token               TEXT,
  access_token_expires_at     TIMESTAMPTZ,
  refresh_token_expires_at    TIMESTAMPTZ,
  scope                       TEXT,
  id_token                    TEXT,
  password                    TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE accounts IS 'Bảng liên kết một người dùng với nhiều phương thức đăng nhập (credentials, social).';
COMMENT ON COLUMN accounts.id IS 'ID của liên kết (Primary Key)';
COMMENT ON COLUMN accounts.user_id IS 'Liên kết tới người dùng';
COMMENT ON COLUMN accounts.provider_id IS 'Nhà cung cấp xác thực (ví dụ: ''credentials'', ''google'')';
COMMENT ON COLUMN accounts.account_id IS 'ID của người dùng tại nhà cung cấp đó (ví dụ: email cho ''credentials'')';
COMMENT ON COLUMN accounts.password IS 'Nơi lưu trữ HASHED PASSWORD cho provider ''credentials''';
COMMENT ON COLUMN accounts.created_at IS 'Thời điểm liên kết được tạo';
COMMENT ON COLUMN accounts.updated_at IS 'Thời điểm liên kết được cập nhật';

CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_account_unique_idx ON accounts (provider_id, account_id);
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts (user_id);
CREATE INDEX IF NOT EXISTS accounts_provider_id_idx ON accounts (provider_id);


-- 4) VERIFICATIONS
CREATE TABLE IF NOT EXISTS verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier        TEXT NOT NULL,
  value             TEXT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE verifications IS 'Bảng lưu trữ các token dùng một lần cho việc xác thực email, reset mật khẩu.';
COMMENT ON COLUMN verifications.id IS 'ID của token (Primary Key)';
COMMENT ON COLUMN verifications.identifier IS 'Loại token (ví dụ: ''email-verification'', ''password-reset'')';
COMMENT ON COLUMN verifications.value IS 'Giá trị token bí mật';
COMMENT ON COLUMN verifications.expires_at IS 'Thời điểm token hết hạn';
COMMENT ON COLUMN verifications.created_at IS 'Thời điểm token được tạo';
COMMENT ON COLUMN verifications.updated_at IS 'Thời điểm token được cập nhật';

CREATE UNIQUE INDEX IF NOT EXISTS verifications_identifier_value_unique_idx ON verifications (identifier, value);
CREATE INDEX IF NOT EXISTS verifications_expires_at_idx ON verifications (expires_at);
CREATE INDEX IF NOT EXISTS verifications_identifier_idx ON verifications (identifier);


-- 5) PASSKEYS
CREATE TABLE IF NOT EXISTS passkeys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  public_key    TEXT NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  counter       BIGINT NOT NULL DEFAULT 0,
  device_type   TEXT,
  backed_up     BOOLEAN NOT NULL DEFAULT FALSE,
  transports    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aaguid        TEXT
);

COMMENT ON TABLE passkeys IS 'Bảng lưu trữ thông tin xác thực không mật khẩu (WebAuthn).';
COMMENT ON COLUMN passkeys.credential_id IS 'ID của credential, duy nhất trên toàn hệ thống';
COMMENT ON COLUMN passkeys.counter IS 'Bộ đếm để chống tấn công lặp lại (replay attacks)';

CREATE UNIQUE INDEX IF NOT EXISTS passkeys_credential_id_unique_idx ON passkeys (credential_id);
CREATE INDEX IF NOT EXISTS passkeys_user_id_idx ON passkeys (user_id);
CREATE INDEX IF NOT EXISTS passkeys_aaguid_idx ON passkeys (aaguid);


-- ===============================================================
-- SECTION 2: APPLICATION BUSINESS LOGIC SCHEMA
-- ===============================================================

-- 6) SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    plan_type SMALLINT NOT NULL DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 0,
    current_period_end TIMESTAMPTZ,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Bảng quản lý gói thuê bao của người dùng.';
COMMENT ON COLUMN subscriptions.id IS 'ID của gói thuê bao (Primary Key)';
COMMENT ON COLUMN subscriptions.user_id IS 'Liên kết duy nhất tới người dùng';
COMMENT ON COLUMN subscriptions.plan_type IS 'Loại gói thuê bao hiện tại của người dùng (ENUM: 0=Free, 1=Premium, 2=VIP)';
COMMENT ON COLUMN subscriptions.status IS 'Trạng thái của gói thuê bao (ENUM: 0=Active, 1=Canceled, 2=Past Due)';
COMMENT ON COLUMN subscriptions.current_period_end IS 'Ngày hết hạn của chu kỳ thanh toán hiện tại';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'ID khách hàng trên Stripe (để quản lý thanh toán)';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'ID gói thuê bao trên Stripe';
COMMENT ON COLUMN subscriptions.created_at IS 'Thời điểm gói được tạo';
COMMENT ON COLUMN subscriptions.updated_at IS 'Thời điểm gói được cập nhật lần cuối';

-- 7) ROLES
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

COMMENT ON TABLE roles IS 'Bảng định nghĩa các vai trò trong hệ thống (RBAC).';
COMMENT ON COLUMN roles.id IS 'ID của vai trò (Primary Key)';
COMMENT ON COLUMN roles.name IS 'Tên vai trò duy nhất (ví dụ: ''Admin'', ''Moderator'')';

-- 8) PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

COMMENT ON TABLE permissions IS 'Bảng định nghĩa các quyền hạn chi tiết (RBAC).';
COMMENT ON COLUMN permissions.id IS 'ID của quyền (Primary Key)';
COMMENT ON COLUMN permissions.name IS 'Tên quyền duy nhất (ví dụ: ''comment:delete_any'')';

-- 9) USER_ROLES
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Bảng nối nhiều-nhiều giữa Users và Roles, xác định vai trò của người dùng.';
COMMENT ON COLUMN user_roles.user_id IS 'Liên kết tới người dùng';
COMMENT ON COLUMN user_roles.role_id IS 'Liên kết tới vai trò';

-- 10) ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Bảng nối nhiều-nhiều giữa Roles và Permissions.';
COMMENT ON COLUMN role_permissions.role_id IS 'Liên kết tới vai trò';
COMMENT ON COLUMN role_permissions.permission_id IS 'Liên kết tới quyền';

-- 11) TEAMS
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE teams IS 'Bảng quản lý các nhóm sáng tạo (ví dụ: nhóm dịch, nhà xuất bản).';
COMMENT ON COLUMN teams.id IS 'ID của nhóm (Primary Key)';
COMMENT ON COLUMN teams.owner_user_id IS 'ID của người dùng sở hữu nhóm';
COMMENT ON COLUMN teams.name IS 'Tên của nhóm';
COMMENT ON COLUMN teams.slug IS 'Chuỗi định danh duy nhất cho URL (ví dụ: ''my-scan-team'')';
COMMENT ON COLUMN teams.logo_url IS 'URL logo của nhóm';
COMMENT ON COLUMN teams.description IS 'Mô tả về nhóm';
COMMENT ON COLUMN teams.created_at IS 'Thời điểm nhóm được tạo';
COMMENT ON COLUMN teams.updated_at IS 'Thời điểm nhóm được cập nhật lần cuối';

-- 12) TEAM_MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role SMALLINT NOT NULL DEFAULT 2,
    PRIMARY KEY (team_id, user_id)
);

COMMENT ON TABLE team_members IS 'Bảng quản lý thành viên và vai trò trong một nhóm.';
COMMENT ON COLUMN team_members.team_id IS 'Liên kết tới nhóm';
COMMENT ON COLUMN team_members.user_id IS 'Liên kết tới người dùng là thành viên';
COMMENT ON COLUMN team_members.role IS 'Vai trò của thành viên trong nhóm (ENUM: 0=Owner, 1=Editor, 2=Uploader)';


-- ===============================================================
-- SECTION 3: FULL-TEXT SEARCH ENHANCEMENTS
-- ===============================================================

-- FTS Index cho bảng 'users'
CREATE INDEX IF NOT EXISTS users_fts_idx ON users USING GIN (
  to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(display_username, ''))
);

COMMENT ON INDEX users_fts_idx IS 'GIN index để tối ưu hóa Full-Text Search trên cột name và display_username, sử dụng cấu hình ngôn ngữ ''simple'' để không phân biệt ngôn ngữ.';

-- FTS Index cho bảng 'teams' (BỔ SUNG)
CREATE INDEX IF NOT EXISTS teams_fts_idx ON teams USING GIN (
  to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

COMMENT ON INDEX teams_fts_idx IS 'GIN index để tối ưu hóa Full-Text Search trên cột name và description, sử dụng cấu hình ''simple'' để không phân biệt ngôn ngữ.';

COMMIT;