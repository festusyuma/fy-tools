import { PaginationData } from '../schema.js';

export const updatePagination = (
  pagination: PaginationData,
  totalItems: number
): PaginationData => {
  return {
    ...pagination,
    totalItems,
    totalPages: Math.ceil(totalItems / pagination.size) || 1,
  };
};
