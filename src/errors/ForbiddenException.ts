import { AppError } from "./AppError";

export class ForbiddenException extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}
