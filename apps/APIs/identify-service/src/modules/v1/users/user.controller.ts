import Elysia from "elysia";
import { GetListUser } from "./user.model";
import { UserService } from "./user.service";
import {
  createInternalServerErrorResponse,
  createPaginatedResponse,
} from "@repo/utils";

export const userRoutesV1 = new Elysia({
  name: "userRoutesV1",
  prefix: "/users",
})
  .model({})
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const { users, pagination } = await UserService.getListUser({
          page: query.page,
          limit: query.limit,
          search: query.search,
          sort_field: query.sort_field,
          sort_order: query.sort_order,
        });

        return createPaginatedResponse(
          users,
          pagination,
          "Users retrieved successfully",
        );
      } catch (error) {
        console.error("Error in GET /users:", error);
        set.status = 500;
        return createInternalServerErrorResponse(
          error instanceof Error ? error.message : "Failed to retrieve users",
        );
      }
    },
    {
      query: GetListUser,
      detail: {
        tags: ["User Management"],
        summary: "Get paginated list of users",
        description: `
          Retrieve a paginated list of users with optional search and sorting capabilities.
          
          **Features:**
          - Full-text search across user names and display names
          - Sorting by multiple fields (name, username, email, created_at, updated_at)
          - Configurable pagination with limits
          - Comprehensive error handling
          
          **Search Functionality:**
          The search parameter uses PostgreSQL full-text search (GIN indexes) to efficiently search across:
          - User's full name
          - Display username
          
          **Sorting Options:**
          - \`sort_field\`: Choose from name, username, email, created_at, updated_at
          - \`sort_order\`: asc (ascending) or desc (descending)
          
          **Pagination:**
          - \`page\`: Page number (starts from 1)
          - \`limit\`: Number of items per page (1-100, default: 10)
        `.trim(),
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number for pagination (minimum: 1)",
            required: false,
            schema: {
              type: "number",
              minimum: 1,
              default: 1,
            },
            example: 1,
          },
          {
            name: "limit",
            in: "query",
            description: "Number of items per page (1-100)",
            required: false,
            schema: {
              type: "number",
              minimum: 1,
              maximum: 100,
              default: 10,
            },
            example: 20,
          },
          {
            name: "search",
            in: "query",
            description: "Search term for full-text search across user names",
            required: false,
            schema: {
              type: "string",
              minLength: 1,
              maxLength: 255,
            },
            example: "john doe",
          },
          {
            name: "sort_field",
            in: "query",
            description: "Field to sort by",
            required: false,
            schema: {
              type: "string",
              enum: ["name", "username", "email", "created_at", "updated_at"],
              default: "created_at",
            },
            example: "created_at",
          },
          {
            name: "sort_order",
            in: "query",
            description: "Sort order (ascending or descending)",
            required: false,
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
            example: "desc",
          },
        ],
        responses: {
          "200": {
            description: "Successfully retrieved paginated user list",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UsersListResponse",
                },
                examples: {
                  successful_response: {
                    summary: "Successful user list retrieval",
                    value: {
                      success: true,
                      status_code: 200,
                      message: "Users retrieved successfully",
                      metadata: {
                        items: [
                          {
                            id: "123e4567-e89b-12d3-a456-426614174000",
                            name: "John Doe",
                            username: "johndoe",
                            display_username: "JohnD",
                            email: "john.doe@example.com",
                            email_verified: true,
                            is_anonymous: false,
                            image: "https://example.com/avatar.jpg",
                            metadata: {},
                            created_at: "2024-01-01T00:00:00Z",
                            updated_at: "2024-01-01T00:00:00Z",
                          },
                        ],
                        pagination: {
                          page: 1,
                          per_page: 10,
                          total: 25,
                          total_pages: 3,
                          has_next: true,
                          has_prev: false,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad Request - Invalid query parameters",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                examples: {
                  validation_error: {
                    summary: "Validation error example",
                    value: {
                      success: false,
                      status_code: 400,
                      message: "Invalid query parameters",
                      error: {
                        code: "VALIDATION_ERROR",
                        details: {
                          page: "Must be a positive number",
                          limit: "Must be between 1 and 100",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                examples: {
                  server_error: {
                    summary: "Server error example",
                    value: {
                      success: false,
                      status_code: 500,
                      message: "Failed to retrieve users",
                      error: {
                        code: "INTERNAL_SERVER_ERROR",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  );
