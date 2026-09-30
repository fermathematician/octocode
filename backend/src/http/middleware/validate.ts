import type { RequestHandler } from "express";

export interface ValidationSchemas {
  body?: (value: unknown) => unknown;
  params?: (value: unknown) => unknown;
  query?: (value: unknown) => unknown;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (request, _response, next) => {
    try {
      request.validated = {
        body: schemas.body ? schemas.body(request.body) : undefined,
        params: schemas.params ? schemas.params(request.params) : undefined,
        query: schemas.query ? schemas.query(request.query) : undefined,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
