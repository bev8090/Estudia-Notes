// An error whose message is safe to show the user, with the HTTP status to send.
// Anything else that reaches the error handler becomes a generic 500.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// An AI step failed in a way the user should hear about ("couldn't read this photo").
// Background jobs save this message on the failed row so the UI can display it.
export class AiError extends Error {}
