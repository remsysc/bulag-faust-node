import { UnauthorizedException } from "@/errors/UnauthorizedException";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "@/types/entities";

export const verify = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new UnauthorizedException("Invalid credentials"));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT SECRET  is not defined"); //fail fast

  jwt.verify(token, secret, (err, decoded) => {
    if (err)
      return next(new UnauthorizedException("Invalid or exprired token"));
    req.user = decoded as JWTPayload;
    next();
  });
};
