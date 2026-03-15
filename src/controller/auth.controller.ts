import { RequestHandler } from "express";

import * as authService from "../services/auth.service";

export const register: RequestHandler = async (
  req,
  res,
  next,
): Promise<void> => {
  try {
    const token = await authService.register(req.body);
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
};

export const login: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const token = await authService.login(req.body);
    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};
