import pool from "@/db";
import { Category } from "@/types/entities";

const findAll = async (): Promise<Category[]> => {
  const result = await pool.query<Category>(
    `SELECT id, name, created_at, updated_at FROM categories LIMIT 10`,
  );
  return result.rows;
};

const findById = async (id: string): Promise<Category | null> => {
  const result = await pool.query<Category>(
    `SELECT id, name, created_at 
  FROM  categories
  WHERE id = $1 LIMIT 1
`,
    [id],
  );
  return result.rows[0] ?? null;
};

const createCategory = async (name: string): Promise<Category> => {
  const result = await pool.query<Category>(
    `  INSERT INTO categories(name) VALUES($1)
    RETURNING id, name, created_at, updated_at
`,
    [name],
  );

  return result.rows[0];
};

const updateCategoryById = async (
  id: string,
  name: string,
): Promise<Category | null> => {
  const result = await pool.query<Category>(
    `UPDATE categories
    SET name = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, name, created_at, updated_at`,
    [name, id],
  );

  return result.rows[0] ?? null;
};

const deleteById = async (id: string): Promise<Category | null> => {
  const result = await pool.query(
    `DELETE FROM categories WHERE id  = $1
  RETURNING id, name, created_at, updated_at
`,
    [id],
  );

  return result.rows[0] ?? null;
};
