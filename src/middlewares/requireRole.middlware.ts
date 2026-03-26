import { ForbiddenException } from "@/errors/ForbiddenException";
import { NextFunction, Response, Request } from "express";

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles ?? [];
    if (!userRoles.includes(role)) {
      return next(new ForbiddenException("Insufficient permission"));
    }
    next();
  };
};
