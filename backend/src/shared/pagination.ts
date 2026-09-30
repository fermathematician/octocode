import { ValidationError } from "./validation.js";

export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 200;

export interface Pagination {
  limit: number;
  cursor?: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export function parsePagination(
  record: Record<string, unknown>,
): Pagination {
  const rawLimit = record.limit;
  const rawCursor = record.cursor;

  let limit = DEFAULT_LIMIT;

  if (rawLimit !== undefined) {
    if (typeof rawLimit !== "string" || !/^\d+$/.test(rawLimit)) {
      throw new ValidationError("limit must be a positive integer.");
    }

    const parsed = Number(rawLimit);

    if (parsed < 1) {
      throw new ValidationError("limit must be at least 1.");
    }

    limit = Math.min(parsed, MAX_LIMIT);
  }

  let cursor: string | undefined;

  if (rawCursor !== undefined) {
    if (typeof rawCursor !== "string" || rawCursor.trim().length === 0) {
      throw new ValidationError("cursor must be a non-empty string.");
    }

    cursor = rawCursor.trim();
  }

  return cursor ? { limit, cursor } : { limit };
}

export function buildPage<T extends { id: string }>(
  rows: T[],
  limit: number,
): Paginated<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? last.id : null,
  };
}
