import pool from "../db/";
import { Role } from "../types/entities";

export const findByName = async (name: string): Promise<Role | null> => {
  const result = await pool.query<Role>(
    `SELECT * FROM roles WHERE name = $1 LIMIT 1`,
    [name],
  );

  return result.rows[0] ?? null;
};
export const findByUserRoles = async (userId: string): Promise<Role[]> => {
  const result = await pool.query<Role>(
    `SELECT r.id, r.name FROM roles r 
          JOIN user_roles ur ON ur.role_id = r.id 
          WHERE ur.user_id  = $1`,
    [userId],
  );

  return result.rows;
};

export const assignRoleToUser = async (
  userId: string,
  roleId: string,
): Promise<void> => {
  await pool.query<Role>(
    `INSERT INTO user_roles(user_id, role_id) VALUES ($1, $2) 
    ON CONFLICT(user_id, role_id) DO NOTHING`,
    [userId, roleId],
  );
};
