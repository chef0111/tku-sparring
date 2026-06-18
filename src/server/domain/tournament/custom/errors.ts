export class CustomMatchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomMatchValidationError';
  }
}
