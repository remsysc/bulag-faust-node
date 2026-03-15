import { AppError } from "./AppError";

export class UnauthorizedException extends AppError {
  constructor(resource: string, identifier: string | number) {
    super(resource + " not authorized with identifier: " + identifier, 401);
  }
}
