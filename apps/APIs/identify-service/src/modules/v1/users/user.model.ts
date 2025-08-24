import { t } from "elysia";

// Query validation schema for GET /users endpoint
export const GetListUser = t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  search: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  sort_field: t.Optional(
    t.Union([
      t.Literal("name"),
      t.Literal("username"),
      t.Literal("email"),
      t.Literal("created_at"),
      t.Literal("updated_at"),
    ]),
  ),
  sort_order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
});

// Response schemas for Swagger documentation
export const UserResponse = t.Object({
  id: t.String(),
  name: t.String(),
  username: t.String(),
  display_username: t.String(),
  email: t.String(),
  email_verified: t.Boolean(),
  is_anonymous: t.Boolean(),
  image: t.String(),
  metadata: t.Object({}),
  created_at: t.Union([t.Date(), t.String()]),
  updated_at: t.Union([t.Date(), t.String()]),
});

export const PaginationMeta = t.Object({
  page: t.Number(),
  per_page: t.Number(),
  total: t.Number(),
  total_pages: t.Number(),
  has_next: t.Boolean(),
  has_prev: t.Boolean(),
});

export const UsersListResponse = t.Object({
  success: t.Boolean(),
  status_code: t.Number(),
  message: t.Optional(t.String()),
  metadata: t.Object({
    items: t.Array(UserResponse),
    pagination: PaginationMeta,
  }),
});

export const ErrorResponse = t.Object({
  success: t.Boolean(),
  status_code: t.Number(),
  message: t.Optional(t.String()),
  error: t.Object({
    code: t.String(),
    details: t.Optional(t.Unknown()),
  }),
});
