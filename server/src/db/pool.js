import mysql from 'mysql2/promise';
import { dbEnv as env } from '../config/database.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
  connectTimeout: 10000,
  charset: 'utf8mb4',
  timezone: 'Z'
});
