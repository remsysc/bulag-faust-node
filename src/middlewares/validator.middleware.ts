import { BadRequestException } from "../errors/BadRequestException";
import { NextFunction, Request, Response } from "express";
import z from "zod";
export const validate =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const pretty = z.prettifyError(parsed.error);
      next(new BadRequestException(pretty));
    } else next();
  };
