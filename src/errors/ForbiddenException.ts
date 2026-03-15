import { AppError } from "./AppError";

export class ForbiddenException extends AppError {
  constructor(resource: string, identifier: string | number) {
    super(resource + " is forbidden with identifier:  " + identifier, 403);
  }
}
