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

// Transaction type - Bun SQL transaction instance
export type Transaction = any; // This will be the tx parameter from sql.begin(async (tx) => {})

// Repository interface
export interface IRepository<T extends BaseEntity> {
  findById(id: string, tx?: Transaction): Promise<T | null>;
  findAll(options?: FindManyOptions, tx?: Transaction): Promise<T[]>;
  findMany(options?: FindManyOptions, tx?: Transaction): Promise<PaginationResult<T>>;
  create(data: Omit<T, "id" | "created_at" | "updated_at">, tx?: Transaction): Promise<T>;
  update(
    id: string,
    data: Partial<Omit<T, "id" | "created_at" | "updated_at">>,
    tx?: Transaction
  ): Promise<T | null>;
  delete(id: string, tx?: Transaction): Promise<boolean>;
  exists(id: string, tx?: Transaction): Promise<boolean>;
  count(where?: Record<string, any>, tx?: Transaction): Promise<number>;
}
