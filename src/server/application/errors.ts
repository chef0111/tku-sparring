export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {}
export class PolicyViolationError extends AppError {}
export class BadRequestError extends AppError {}
export class ForbiddenError extends AppError {}
