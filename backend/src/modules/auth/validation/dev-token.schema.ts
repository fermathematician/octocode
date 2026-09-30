import {
  asObject,
  requireString,
} from "../../../shared/validation.js";

export interface DevTokenInput {
  token: string;
}

export function parseDevTokenBody(value: unknown): DevTokenInput {
  const record = asObject(value);

  return {
    token: requireString(record, "token", { maxLength: 255 }).trim(),
  };
}
