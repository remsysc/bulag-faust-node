import { AppError } from "./AppError";

export class NotFoundException extends AppError {
  constructor(resource: string, identifier: string | number) {
    super(resource + " not found with identifier: " + identifier, 404);
  }
}
