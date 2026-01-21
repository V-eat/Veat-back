import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST || process.env.DB_HOST || "localhost",
  user: process.env.PGUSER || process.env.DB_USER || process.env.USER,
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
  database: process.env.PGDATABASE || process.env.DB_NAME,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

export default pool;
