import dotenv from 'dotenv';
import pool from '../models/db';

dotenv.config();

async function migrateDatabase() {
  console.log('Starting database migration...');
  console.log('Database URL:', process.env.DATABASE_URL);
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Create log_analysis_results table
    console.log('\nCreating log_analysis_results table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS log_analysis_results (
        id SERIAL PRIMARY KEY,
        log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE UNIQUE,
        total_analyzed INTEGER NOT NULL DEFAULT 0,
        total_anomalies INTEGER NOT NULL DEFAULT 0,
        analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        analysis_status VARCHAR(50) DEFAULT 'pending',
        analysis_summary JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ log_analysis_results table created successfully!');
    
    // Create indexes
    console.log('\nCreating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_log_analysis_results_log_id ON log_analysis_results(log_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_log_analysis_results_status ON log_analysis_results(analysis_status);
    `);
    console.log('✅ Indexes created successfully!');
    
    // Add comments
    console.log('\nAdding table comments...');
    await client.query(`
      COMMENT ON TABLE log_analysis_results IS 'Detailed analysis results for uploaded log files';
      COMMENT ON COLUMN log_analysis_results.log_id IS 'Reference to the log file being analyzed';
      COMMENT ON COLUMN log_analysis_results.total_analyzed IS 'Total number of log lines analyzed';
      COMMENT ON COLUMN log_analysis_results.total_anomalies IS 'Total number of anomalies detected';
      COMMENT ON COLUMN log_analysis_results.analysis_status IS 'Current status of the analysis (pending, completed, failed)';
      COMMENT ON COLUMN log_analysis_results.analysis_summary IS 'JSON summary of analysis results and statistics';
    `);
    console.log('✅ Table comments added successfully!');
    
    // Check if table exists and show structure
    console.log('\nVerifying table structure...');
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'log_analysis_results'
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Table structure:');
    tableCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    client.release();
    console.log('\n🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  
  process.exit(0);
}

migrateDatabase(); 