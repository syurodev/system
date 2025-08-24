import { UserEntity } from "../../../database/entities/user.entity";
import { UserRepository } from "../../../database/repositories/user.repository";
import { PaginationMeta } from "@repo/utils";
import { GetListUser } from "./user.model";

export abstract class UserService {
  private static _userRepository: UserRepository | null = null;

  /**
   * Get UserRepository instance (lazy initialization)
   */
  private static getUserRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  /**
   * Get paginated list of users with optional search and sorting
   *
   * @param options Query parameters for filtering and pagination
   * @returns Promise with paginated user list and metadata
   */
  static async getListUser(options?: typeof GetListUser.static) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_field = "created_at",
      sort_order = "desc",
    } = options || {};
    const offset = (page - 1) * limit;

    try {
      // Build search conditions
      let searchCondition = "";
      let searchParams: any[] = [];

      if (search) {
        searchCondition = `
          WHERE to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(display_username, '')) @@ 
                plainto_tsquery('simple', $${searchParams.length + 1})
        `;
        searchParams.push(search);
      }

      // Build sort clause with proper SQL injection protection
      const validSortFields = [
        "name",
        "username",
        "email",
        "created_at",
        "updated_at",
      ];
      const sortField = validSortFields.includes(sort_field)
        ? sort_field
        : "created_at";
      const sortOrder = sort_order === "asc" ? "ASC" : "DESC";

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM ${UserEntity.getTableName()} 
        ${searchCondition}
      `;

      const countResult = await this.getUserRepository().executeQuery(
        countQuery,
        searchParams,
      );
      const total = parseInt(countResult[0]?.total || "0");

      // Get paginated users
      const usersQuery = `
        SELECT * 
        FROM ${UserEntity.getTableName()} 
        ${searchCondition}
        ORDER BY ${sortField} ${sortOrder}
        LIMIT $${searchParams.length + 1} OFFSET $${searchParams.length + 2}
      `;

      const queryParams = [...searchParams, limit, offset];
      const usersResult = await this.getUserRepository().executeQuery(
        usersQuery,
        queryParams,
      );

      // Map to entities
      const users = UserEntity.fromRows(usersResult);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const pagination: PaginationMeta = {
        page: page,
        per_page: limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      };

      return {
        users,
        pagination,
      };
    } catch (error) {
      console.error("Error in UserService.getListUser:", error);
      throw new Error("Failed to retrieve users");
    }
  }
}
