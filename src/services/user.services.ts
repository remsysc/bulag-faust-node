import { UserPublic } from "@/types/entities";
import { findById } from "@/repositories/user.repository";
import { NotFoundException } from "@/errors/NotFoundException";
export const getCurrentUser = async (userId: string): Promise<UserPublic> => {
  const user = await findById(userId);
  if (!user) {
    throw new NotFoundException("User is not found with id: " + userId);
  }
  return user;
};

export const getPublicUserById = async (
  userId: string,
): Promise<UserPublic> => {
  const user = await findById(userId);
  if (!user)
    throw new NotFoundException("User is not found with id: " + userId);
  return user;
};
