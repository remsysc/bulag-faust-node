import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "@/common/db/prisma";
import { findByUserRoles } from "../role/role.repository";
import { findByEmail } from "../user/user.repository";
import { RegisterCredentials, LoginCredentials } from "./auth.schema";
import { UnauthorizedException } from "@/common/errors/UnauthorizedException";
import { NotFoundException } from "@/common/errors/NotFoundException";
import { config } from "@/config/config";
import { DuplicateResourceException } from "@/common/errors/DuplicateResourceException";

export const register = async (data: RegisterCredentials): Promise<string> => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    //create user and return a jwt token
    return await prisma.$transaction(async (tx) => {
      const role = await tx.role.findFirst({
        where: { name: "ROLE_USER" },
      });
      if (!role) {
        throw new NotFoundException("ROLE USER is not found");
      }
      const user = await tx.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
      return jwt.sign(
        {
          userId: user.id,
          email: user.email,
          roles: ["ROLE_USER"],
        },
        config.JWT_SECRET,
        {
          expiresIn: config.jwtExpiresIn,
        },
      );
    });
  } catch (err) {
    //prisma specific errors
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = err.meta?.target; // email or username
      if (Array.isArray(target) && target.includes("email")) {
        throw new DuplicateResourceException("User", "email");
      }
      if (Array.isArray(target) && target.includes("username")) {
        throw new DuplicateResourceException("User", "username");
      }
    }
    throw err;
  }
};

export const login = async (data: LoginCredentials): Promise<string> => {
  const user = await findByEmail(data.email);
  if (!user) throw new UnauthorizedException("Invalid credentials");

  const pass = await bcrypt.compare(data.password, user.password);
  if (!pass) throw new UnauthorizedException("Invalid credentials");
  const roles = await findByUserRoles(user.id);
  const roleNames = roles.map((role) => role.name);

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      roles: roleNames,
    },
    config.JWT_SECRET,
    {
      expiresIn: config.jwtExpiresIn,
    },
  );
};
