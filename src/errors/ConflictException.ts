import { AppError } from "./AppError";

export class ConflictException extends AppError {
  constructor(resource: string, identifier: string | number) {
    super(resource + " conflicts with identifier: " + identifier, 409);
  }
}
