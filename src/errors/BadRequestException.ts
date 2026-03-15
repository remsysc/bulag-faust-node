import { AppError } from "./AppError";

export class BadRequestException extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
