export class EmailSendError extends Error {
  constructor(message: string, public readonly transient = false) {
    super(message);
    this.name = "EmailSendError";
  }
}
