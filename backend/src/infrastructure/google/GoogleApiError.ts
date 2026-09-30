export class GoogleApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

export class GoogleSyncTokenExpiredError extends Error {
  constructor() {
    super("Google sync token expired; a full resync is required.");
    this.name = "GoogleSyncTokenExpiredError";
  }
}
