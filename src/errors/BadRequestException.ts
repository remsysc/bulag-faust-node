import { AppError } from "./AppError";

export class BadRequestException extends AppError {
  constructor(resource: string, identifier: string | any) {
    super(resource + " bad request with identifier: " + identifier, 400);
  }
}
