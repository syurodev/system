// Query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

export interface FindManyOptions extends QueryOptions {
  where?: Record<string, any>;
}

// Pagination result
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Base entity interface (common fields) - matches database snake_case
export interface BaseEntity {
  id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// Repository interface
export interface IRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindManyOptions): Promise<T[]>;
  findMany(options?: FindManyOptions): Promise<PaginationResult<T>>;
  create(data: Omit<T, "id" | "created_at" | "updated_at">): Promise<T>;
  update(
    id: string,
    data: Partial<Omit<T, "id" | "created_at" | "updated_at">>,
  ): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(where?: Record<string, any>): Promise<number>;
}
