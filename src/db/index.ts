import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection test failed:", (err as Error).message);
  } else {
    console.log("Database connected successfully");
  }
});

export default pool;
