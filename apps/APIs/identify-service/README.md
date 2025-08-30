# Identity Service với Better Auth

Identity Service sử dụng Better Auth và custom Bun SQL adapter để quản lý authentication và user management.

## Tính năng

- ✅ Better Auth integration với custom adapter
- ✅ PostgreSQL database với existing schema
- ✅ ElysiaJS framework
- ✅ TypeScript type safety
- ✅ RESTful API endpoints
- ✅ Swagger documentation
- ✅ CORS support
- ✅ Session management
- ✅ User authentication (email/password)
- ✅ Password management
- ✅ Profile management

## Cấu trúc dự án

```
src/
├── configs/
│   └── env.ts              # Environment configuration
├── lib/
│   ├── auth.ts             # Better Auth instance
│   └── bun-sql-adapter.ts  # Custom Bun SQL adapter
├── modules/
│   ├── auth/
│   │   └── auth.controller.ts  # Auth API endpoints
│   ├── v1/
│   │   └── users/          # User management
│   └── public/
└── index.ts                # Main server file
```

## Cài đặt

1. **Clone và cài đặt dependencies:**
```bash
cd apps/APIs/identify-service
bun install
```

2. **Thiết lập environment variables:**
```bash
cp .env.example .env
```

Cập nhật các giá trị trong `.env`:
```bash
# Database
CONFIG_PG_USER_HOST=localhost
CONFIG_PG_USER_PORT=5432
CONFIG_PG_USER_USERNAME=your_username
CONFIG_PG_USER_PASSWORD=your_password
CONFIG_PG_USER_DBNAME=your_database

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-minimum-32-characters
BETTER_AUTH_URL=http://localhost:3101
```

3. **Chạy database migration:**
Đảm bảo database schema đã được tạo từ `db-init/auth-service.sql`

4. **Khởi chạy service:**
```bash
bun run dev
```

## API Endpoints

### Authentication Endpoints

**Base URL:** `http://localhost:3101/api/auth`

#### 1. Sign Up
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "username": "johndoe" // optional
}
```

#### 2. Sign In
```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "securepassword"
}
```

#### 3. Get Current Session
```bash
GET /api/auth/session
Cookie: better-auth.session_token=your_token
```

#### 4. Sign Out
```bash
POST /api/auth/signout
Cookie: better-auth.session_token=your_token
```

#### 5. Change Password
```bash
POST /api/auth/change-password
Cookie: better-auth.session_token=your_token
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### 6. Update Profile
```bash
PATCH /api/auth/profile
Cookie: better-auth.session_token=your_token
Content-Type: application/json

{
  "name": "Updated Name",
  "username": "newusername", // optional
  "image": "https://example.com/avatar.jpg" // optional
}
```

### Better Auth Core Endpoints

Better Auth cũng cung cấp các endpoints core tại `/api/auth/*`:

- `POST /api/auth/sign-up/email` - Better Auth native signup
- `POST /api/auth/sign-in/email` - Better Auth native signin
- `GET /api/auth/get-session` - Get session info
- `POST /api/auth/sign-out` - Sign out
- Và nhiều endpoints khác...

## Database Schema

Service sử dụng schema PostgreSQL hiện có với các tables:

### Core Tables (Better Auth)
- `users` - User information
- `sessions` - Active sessions  
- `accounts` - Authentication providers
- `verifications` - Email verification tokens
- `passkeys` - WebAuthn credentials

### Business Tables
- `subscriptions` - User subscriptions
- `roles` & `permissions` - RBAC system
- `user_roles` & `role_permissions` - Role assignments
- `teams` & `team_members` - Team management

## Custom Adapter

Custom Bun SQL adapter (`src/lib/bun-sql-adapter.ts`) provides:

- ✅ Direct integration với existing PostgreSQL schema
- ✅ Optimized cho Bun runtime performance
- ✅ Type-safe database operations
- ✅ Support for all Better Auth features
- ✅ UUID primary keys
- ✅ JSON field support
- ✅ Proper error handling và debugging

## Session Management

Sessions được quản lý tự động bởi Better Auth:

- Cookie-based sessions
- 7 days expiration (có thể cấu hình)
- Automatic session renewal
- Secure HTTP-only cookies
- CSRF protection

## Development

### Chạy trong development mode
```bash
bun run dev
```

### Xem API documentation
Sau khi khởi chạy service, truy cập:
```
http://localhost:3101/swagger
```

### Testing
```bash
# Chạy unit tests (nếu có)
bun test

# Test API endpoints với curl hoặc Postman
curl -X POST http://localhost:3101/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

## Production Deployment

1. **Environment variables:**
   - Set secure `BETTER_AUTH_SECRET` (minimum 32 characters)
   - Configure production database credentials
   - Update `BETTER_AUTH_URL` to production domain

2. **Database:**
   - Ensure PostgreSQL schema is deployed
   - Configure connection pooling
   - Set up SSL connections

3. **Security:**
   - Enable HTTPS
   - Configure CORS properly
   - Set secure cookie flags
   - Use proper rate limiting

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check PostgreSQL service is running
   - Verify database credentials trong `.env`
   - Ensure database exists và schema is applied

2. **Better Auth errors:**
   - Verify `BETTER_AUTH_SECRET` is set và secure
   - Check database schema matches Better Auth requirements
   - Enable debug logs: `debugLogs: true` in adapter config

3. **CORS issues:**
   - Update CORS origin trong `src/index.ts`
   - Ensure credentials are properly handled

## Cấu trúc Response

Tất cả API endpoints trả về cấu trúc response nhất quán:

```typescript
{
  success: boolean,
  data: any | null,
  message: string,
  error?: string // only when success = false
}
```

## License

MIT