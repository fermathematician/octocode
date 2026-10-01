import type { AuthContext } from "./authContext.js";
import type { ValidatedRequest } from "./validated.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Required to augment Express's Request type.
  namespace Express {
    interface Request {
      auth?: AuthContext;
      validated?: ValidatedRequest;
      requestId?: string;
      rawBody?: Buffer;
    }
  }
}

export {};
