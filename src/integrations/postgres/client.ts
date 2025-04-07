
import { Pool, PoolClient } from 'pg';
import { toast } from 'sonner';

// Define database connection configuration
interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Get database configuration from environment variables
const getDbConfig = (): DbConfig => {
  // Check if we're in development or production
  if (typeof DB_HOST_PLACEHOLDER === 'undefined' || DB_HOST_PLACEHOLDER === "DB_HOST_PLACEHOLDER") {
    // Development environment - use hardcoded values for development
    console.log("Using development database configuration");
    return {
      host: "localhost",
      port: 5432,
      database: "slingfila",
      user: "postgres",
      password: "postgres",
    };
  } else {
    // Production environment - use placeholder values (replaced by env.sh)
    console.log("Using production database configuration");
    return {
      host: DB_HOST_PLACEHOLDER,
      port: parseInt(DB_PORT_PLACEHOLDER) || 5432,
      database: DB_NAME_PLACEHOLDER,
      user: DB_USER_PLACEHOLDER,
      password: DB_PASSWORD_PLACEHOLDER,
    };
  }
};

// Create connection pool
const createPool = () => {
  const config = getDbConfig();
  console.log("Creating database connection pool with config:", {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password ? "********" : "undefined", // Hide password in logs
  });
  
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: false, // Set to true if your database requires SSL
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
};

// Initialize the pool
let pool = createPool();

// Function to reset the connection pool
export const resetPool = () => {
  console.log("Resetting database connection pool");
  pool.end();
  pool = createPool();
  return pool;
};

// Execute a query with automatic client release
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } catch (error) {
    console.error("Database query error:", error);
    toast.error("Erro na consulta ao banco de dados");
    throw error;
  } finally {
    client.release();
  }
};

// Execute a transaction with automatic client release
export const transaction = async (callback: (client: PoolClient) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Database transaction error:", error);
    toast.error("Erro na transação com o banco de dados");
    throw error;
  } finally {
    client.release();
  }
};

// Test the database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW()');
    console.log("Database connection test successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
};
