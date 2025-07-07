-- Initialize the database for TenexAI Cybersecurity App

-- Create users table with comprehensive security features
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,                               -- track last login time
    role VARCHAR(50) DEFAULT 'user',                    -- roles (admin/user/etc)
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,         -- for future MFA
    password_reset_token VARCHAR(255),                  -- for password resets
    password_reset_expires TIMESTAMP                    -- expiry for reset token
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on role for role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Create index on is_active for filtering active users
CREATE INDEX idx_users_active ON users(is_active);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for the cybersecurity log analysis application';
COMMENT ON COLUMN users.email IS 'Unique email address for user authentication';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password (never store plain text)';
COMMENT ON COLUMN users.last_login IS 'Timestamp of user last login for security monitoring';
COMMENT ON COLUMN users.role IS 'User role for access control (admin, user, analyst, etc.)';
COMMENT ON COLUMN users.mfa_enabled IS 'Flag to indicate if multi-factor authentication is enabled';
COMMENT ON COLUMN users.password_reset_token IS 'Temporary token for password reset functionality';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration timestamp for password reset token';

-- Create logs table for file uploads
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analysis_result JSONB,
  file_path TEXT NOT NULL
);

-- Create log_analysis_results table for storing detailed analysis results
CREATE TABLE IF NOT EXISTS log_analysis_results (
  id SERIAL PRIMARY KEY,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE UNIQUE,
  total_analyzed INTEGER NOT NULL DEFAULT 0,
  total_anomalies INTEGER NOT NULL DEFAULT 0,
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analysis_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  analysis_summary JSONB, -- Summary statistics and metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on log_id for faster lookups
CREATE INDEX idx_log_analysis_results_log_id ON log_analysis_results(log_id);

-- Create index on analysis_status for filtering
CREATE INDEX idx_log_analysis_results_status ON log_analysis_results(analysis_status);

-- Add comments for documentation
COMMENT ON TABLE log_analysis_results IS 'Detailed analysis results for uploaded log files';
COMMENT ON COLUMN log_analysis_results.log_id IS 'Reference to the log file being analyzed';
COMMENT ON COLUMN log_analysis_results.total_analyzed IS 'Total number of log lines analyzed';
COMMENT ON COLUMN log_analysis_results.total_anomalies IS 'Total number of anomalies detected';
COMMENT ON COLUMN log_analysis_results.analysis_status IS 'Current status of the analysis (pending, completed, failed)';
COMMENT ON COLUMN log_analysis_results.analysis_summary IS 'JSON summary of analysis results and statistics';
