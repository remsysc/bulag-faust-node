import { UUID } from "crypto";
import pool from "../db";
import { User, RegisterCredentials } from "../types/entities";
import bcrypt from "bcrypt";

export const findByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query<User>(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );

  return result.rows[0] ?? null;
};

export const findByUsername = async (
  username: string,
): Promise<User | null> => {
  const result = await pool.query<User>(
    `SELECT * FROM users WHERE username = $1 LIMIT 1`,
    [username],
  );
  return result.rows[0] ?? null;
};

export const createUser = async (data: RegisterCredentials): Promise<User> => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const result = await pool.query<User>(
    `
        INSERT INTO users(username, email, password)
        VALUES ($1, $2, $3)
        RETURNING *
`,
    [data.username, data.email, hashedPassword],
  );

  return result.rows[0];
};

export const findById = async (id: string): Promise<User | null> => {
  const result = await pool.query<User>(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
};
