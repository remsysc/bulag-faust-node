import { ConflictException } from "../errors/ConflictException";
import { NotFoundException } from "../errors/NotFoundException";
import {
  assignRoleToUser,
  findByName,
  findByUserRoles,
} from "../repositories/role.repository";
import {
  createUser,
  findByEmail,
  findByUsername,
} from "../repositories/user.repository";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { JWTPayload } from "../types/entities";
import { UnauthorizedException } from "../errors/UnauthorizedException";
import {
  RegisterCredentials,
  LoginCredentials,
} from "@/validator/auth.validator";

export const register = async (data: RegisterCredentials): Promise<string> => {
  const existingEmail = await findByEmail(data.email);
  if (existingEmail) {
    throw new ConflictException("User", data.email);
  }
  const existingUsername = await findByUsername(data.username);
  if (existingUsername) throw new ConflictException("User", data.username);

  const user = await createUser(data);
  const role = await findByName("ROLE_USER");
  if (!role) throw new NotFoundException("ROLE", "ROLE_USER");

  await assignRoleToUser(user.id, role.id);

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  const token: string = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      roles: ["ROLE_USER"],
    } satisfies JWTPayload,
    secret,
    { expiresIn: "15m" },
  );

  return token;
};

export const login = async (data: LoginCredentials): Promise<string> => {
  const user = await findByEmail(data.email);
  if (!user) throw new UnauthorizedException("Invalid credentials");

  const pass = await bcrypt.compare(data.password, user.password);
  if (!pass) throw new UnauthorizedException("Invalid credentaials");
  const roles = await findByUserRoles(user.id);
  const roleNames = roles.map((role) => role.name);
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be defined");

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      roles: roleNames,
    } satisfies JWTPayload,
    secret,
    {
      expiresIn: "15m",
    },
  );
};
