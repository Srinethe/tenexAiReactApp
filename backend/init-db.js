const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Create users table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login TIMESTAMP,
        role VARCHAR(50) DEFAULT 'user',
        mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP
      );
    `;

    console.log('Creating users table...');
    await pool.query(createTableQuery);
    console.log('✅ Users table created successfully!');

    // Create indexes
    console.log('Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);');
    console.log('✅ Indexes created successfully!');

    // Test the table
    console.log('Testing table...');
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Table test successful! Current user count: ${result.rows[0].count}`);

    await pool.end();
    console.log('✅ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase(); 