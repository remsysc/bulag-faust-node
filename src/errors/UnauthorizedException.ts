import { AppError } from "./AppError";

export class UnauthorizedException extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}
