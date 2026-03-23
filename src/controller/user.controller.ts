import { RequestHandler } from "express";
import * as userService from "@/services/user.services";

export const getCurrentUser: RequestHandler = async (
  req,
  res,
  next,
): Promise<void> => {
  try {
    const userId = req.user?.userId as string;
    const user = await userService.getCurrentUser(userId);
    res.status(200).json({
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicUser: RequestHandler = async (
  req,
  res,
  next,
): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const user = await userService.getPublicUserById(userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};
