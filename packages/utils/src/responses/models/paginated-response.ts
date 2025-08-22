/**
 * Paginated API response model
 */

import type {
  APIError,
  APIResponse,
  PaginatedResponseMetadata,
  PaginationMeta,
} from "..";

/**
 * API response metadata model for paginated responses
 */
export class ApiResponseMeta {
  public readonly page: number;
  public readonly per_page: number;
  public readonly total: number;
  public readonly total_pages: number;
  public readonly has_next: boolean;
  public readonly has_prev: boolean;

  constructor(data: Partial<PaginationMeta> = {}) {
    this.page = data.page ?? 1;
    this.per_page = data.per_page ?? 10;
    this.total = data.total ?? 0;
    this.total_pages = data.total_pages ?? 0;
    this.has_next = data.has_next ?? false;
    this.has_prev = data.has_prev ?? false;
  }

  /**
   * Check if there are more pages
   */
  public hasMorePages(): boolean {
    return this.has_next;
  }

  /**
   * Get next page number
   */
  public getNextPage(): number | null {
    return this.has_next ? this.page + 1 : null;
  }

  /**
   * Get previous page number
   */
  public getPrevPage(): number | null {
    return this.has_prev ? this.page - 1 : null;
  }

  /**
   * Get pagination info
   */
  public getPaginationInfo(): {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    startItem: number;
    endItem: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const startItem = (this.page - 1) * this.per_page + 1;
    const endItem = Math.min(this.page * this.per_page, this.total);

    return {
      currentPage: this.page,
      totalPages: this.total_pages,
      totalItems: this.total,
      itemsPerPage: this.per_page,
      startItem,
      endItem,
      hasNext: this.has_next,
      hasPrev: this.has_prev,
    };
  }
}

/**
 * Paginated API response class
 */
export class PaginatedApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly status_code: number;
  public readonly message?: string;
  public readonly metadata?: PaginatedResponseMetadata<T>;
  public readonly error?: APIError;
  private readonly meta: ApiResponseMeta;

  constructor(data: APIResponse<PaginatedResponseMetadata<T>>) {
    this.success = data.success;
    this.status_code = data.status_code;
    this.message = data.message;
    this.metadata = data.metadata;
    this.error = data.error;
    this.meta = new ApiResponseMeta(data.metadata?.pagination);
  }

  /**
   * Check if response was successful
   */
  public isSuccess(): boolean {
    return this.success && this.status_code >= 200 && this.status_code < 300;
  }

  /**
   * Get items
   */
  public getItems(): T[] {
    return this.metadata?.items || [];
  }

  /**
   * Get pagination info
   */
  public getPagination() {
    return this.meta.getPaginationInfo();
  }

  /**
   * Check if it has next page
   */
  public hasNextPage(): boolean {
    return this.meta.hasMorePages();
  }

  /**
   * Get next page number
   */
  public getNextPageNumber(): number | null {
    return this.meta.getNextPage();
  }
}
