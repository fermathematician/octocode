import { AppError } from "./appError.js";

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError("Expected an object body.");
  }

  return value as Record<string, unknown>;
}

export function requireString(
  record: Record<string, unknown>,
  field: string,
  options: { maxLength?: number } = {},
): string {
  const value = record[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required.`);
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(
      `${field} must be at most ${options.maxLength} characters.`,
    );
  }

  return value;
}

export function optionalString(
  record: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = record[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string.`);
  }

  return value;
}

export function requireEnum<T extends string>(
  record: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
): T {
  const value = record[field];

  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(
      `${field} must be one of: ${allowed.join(", ")}.`,
    );
  }

  return value as T;
}

export function requireInt(
  record: Record<string, unknown>,
  field: string,
  options: { min?: number; max?: number } = {},
): number {
  const value = record[field];

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ValidationError(`${field} must be an integer.`);
  }

  if (options.min !== undefined && value < options.min) {
    throw new ValidationError(`${field} must be at least ${options.min}.`);
  }

  if (options.max !== undefined && value > options.max) {
    throw new ValidationError(`${field} must be at most ${options.max}.`);
  }

  return value;
}

export function requireIsoDate(
  record: Record<string, unknown>,
  field: string,
): string {
  const value = requireString(record, field);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${field} must be a YYYY-MM-DD date.`);
  }

  return value;
}

export function requireTime(
  record: Record<string, unknown>,
  field: string,
): string {
  const value = requireString(record, field);

  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new ValidationError(`${field} must be an HH:MM time.`);
  }

  return value;
}

export function requireBranchName(
  record: Record<string, unknown>,
  field: string,
): string {
  const value = requireString(record, field, { maxLength: 120 });

  if (!/^[A-Za-z0-9._/-]+$/.test(value.trim())) {
    throw new ValidationError(
      `${field} may only contain letters, numbers, dots, slashes, dashes or underscores.`,
    );
  }

  return value.trim();
}
