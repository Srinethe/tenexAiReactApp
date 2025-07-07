import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../models/db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authenticateJWT';
import { detectAnomalies, getAnomalyStats } from '../utils/ruleDetection';
import { getLLMExplanation, geminiService } from '../utils/llmAnalysis';
import { LogLine, LogAnalysisResult } from '../types';
import { parse as csvParse } from 'csv-parse/sync';
//import authService from '../services/authService';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads'), // make sure this folder exists
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Upload a log file
router.post('/upload', authenticateJWT, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    // Only allow .csv files
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      res.status(400).json({ message: 'Only CSV files are allowed' });
      return;
    }
    const analysisResult = null;
    // Save metadata to DB
    const result = await pool.query(
      `INSERT INTO logs (user_id, filename, original_filename, analysis_result, file_path)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, file.filename, file.originalname, analysisResult, file.path]
    );
    res.status(201).json({ log: result.rows[0] });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// List all logs for the authenticated user
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT l.id, l.original_filename, l.upload_date, l.analysis_result,
              lar.total_analyzed, lar.total_anomalies, lar.analysis_status, lar.analysis_date
       FROM logs l
       LEFT JOIN log_analysis_results lar ON l.id = lar.log_id
       WHERE l.user_id = $1 
       ORDER BY l.upload_date DESC`,
      [userId]
    );
    res.json({ logs: result.rows });
  } catch (err) {
    console.error('List logs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get analysis and metadata for a specific log
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.userId;
    const logId = req.params.id;
    const result = await pool.query(
      'SELECT * FROM logs WHERE id = $1 AND user_id = $2',
      [logId, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Log not found' });
      return;
    }
    res.json({ log: result.rows[0] });
  } catch (err) {
    console.error('Get log error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/logs/:id/analyze
router.post('/:id/analyze', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  console.log('🚀 REAL ANALYZE ENDPOINT HIT - This is the correct route!');
  try {
    console.log('🔍 Analysis request received for log ID:', req.params.id);
    const userId = req.user.userId;
    const logId = req.params.id;

    // 1. Get file path from DB
    console.log('📂 Fetching log metadata from database...');
    const logMeta = await pool.query(
      'SELECT * FROM logs WHERE id = $1 AND user_id = $2',
      [logId, userId]
    );
    if (logMeta.rows.length === 0) {
      console.log('❌ Log not found in database');
      res.status(404).json({ message: 'Log not found' });
      return;
    }
    const filePath = logMeta.rows[0].file_path;
    console.log('📁 File path:', filePath);

    // 2. Parse CSV file with better error handling
    console.log('📖 Reading CSV file...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('Raw file content (first 300 chars):', fileContent.slice(0, 300));
    
    // Clean the CSV content to handle malformed files
    let cleanedContent = fileContent;
    
    // Split into lines and process each line
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }
    
    let logLines: LogLine[] = [];
    
    // Check if the first line is a malformed header (wrapped in quotes)
    const firstLine = lines[0].trim();
    if (firstLine.startsWith('"') && firstLine.endsWith('"') && firstLine.includes(',')) {
      console.log('🔧 Processing malformed CSV header...');
      // Extract the header from the quoted string
      const headerContent = firstLine.slice(1, -1); // Remove outer quotes
      const headers = headerContent.split(',').map(h => h.trim());
      
      // Process data lines
      const dataLines = lines.slice(1);
      
      for (const line of dataLines) {
        if (!line.trim()) continue;
        
        // Clean the line by removing extra quotes and splitting
        let cleanedLine = line.trim();
        if (cleanedLine.startsWith('"') && cleanedLine.endsWith('"')) {
          cleanedLine = cleanedLine.slice(1, -1);
        }
        
        // Split by comma, but be careful with quoted fields
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let i = 0; i < cleanedLine.length; i++) {
          const char = cleanedLine[i];
          
          if (char === '"') {
            if (inQuotes && cleanedLine[i + 1] === '"') {
              // Double quote - escape sequence
              currentValue += '"';
              i++; // Skip next quote
            } else {
              // Single quote - toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        
        // Add the last value
        values.push(currentValue.trim());
        
        // Create object from headers and values
        const logLine: any = {};
        headers.forEach((header, index) => {
          if (index < values.length) {
            // Clean the value by removing extra quotes
            let value = values[index];
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            logLine[header] = value;
          }
        });
        
        logLines.push(logLine);
      }
      
      console.log('✅ Parsed log lines:', logLines.length);
      console.log('📋 Sample log line:', logLines[0]);
    } else {
      console.log('🔧 Using standard CSV parser...');
      // Use regular CSV parsing for well-formed files
      logLines = csvParse(fileContent, { 
        columns: true, 
        skip_empty_lines: true, 
        bom: true, 
        relax_quotes: true 
      });
      console.log('✅ Parsed log lines:', logLines.length);
    }

    // 3. Rule-based detection
    console.log('🔍 Running rule-based anomaly detection...');
    const anomalies = detectAnomalies(logLines);
    const anomalyStats = getAnomalyStats(anomalies);
    const anomalyCount = anomalyStats.totalAnomalies;
    console.log('🚨 Anomalies detected:', anomalyCount);

    // 4. Single comprehensive LLM analysis for the entire file
    console.log('🤖 Starting comprehensive Gemini analysis for entire file...');
    let fileAnalysis = null;
    try {
      // Create a comprehensive analysis prompt for the entire file
      const analysisPrompt = {
        logLines: logLines,
        anomalies: anomalies.filter(a => a !== undefined),
        anomalyStats: anomalyStats,
        fileInfo: {
          filename: logMeta.rows[0].original_filename,
          totalLines: logLines.length,
          anomalyCount: anomalyCount,
          anomalyPercentage: logLines.length > 0 ? (anomalyCount / logLines.length * 100).toFixed(2) : 0
        }
      };
      
      fileAnalysis = await geminiService.analyzeEntireFile(analysisPrompt);
      console.log('✅ Gemini analysis completed successfully');
    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      fileAnalysis = {
        summary: 'AI analysis temporarily unavailable. Please review the anomalies manually.',
        keyFindings: ['Analysis failed - check backend logs for details'],
        recommendedActions: ['Review anomalies manually and check system configuration'],
        riskLevel: 'Unknown',
        aiConfidenceScore: 0
      };
    }

    console.log('💾 Preparing to save analysis results...');

    // 5. Create analysis summary
    const analysisSummary = {
      total_analyzed: logLines.length,
      total_anomalies: anomalyCount,
      anomaly_percentage: logLines.length > 0 ? (anomalyCount / logLines.length * 100).toFixed(2) : 0,
      analysis_timestamp: new Date().toISOString(),
      file_info: {
        original_filename: logMeta.rows[0].original_filename,
        upload_date: logMeta.rows[0].upload_date
      },
      anomaly_statistics: {
        high_confidence_anomalies: anomalyStats.highConfidenceAnomalies,
        average_confidence: anomalyStats.averageConfidence,
        anomaly_types: anomalyStats.anomalyTypes,
        top_anomaly_types: Object.entries(anomalyStats.anomalyTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => ({ type, count }))
      },
      security_insights: {
        blocked_requests: logLines.filter(log => log.action === 'Blocked').length,
        allowed_requests: logLines.filter(log => log.action === 'Allowed').length,
        critical_threats: logLines.filter(log => log.threatseverity === 'Critical').length,
        high_risk_apps: logLines.filter(log => log.app_risk_score && parseInt(log.app_risk_score) >= 80).length,
        suspicious_ips: new Set(logLines.filter(log => anomalies[logLines.indexOf(log)]).map(log => log.srcip)).size
      },
      // Add comprehensive AI analysis
      ai_analysis: fileAnalysis
    };

    console.log('📊 Analysis summary:', JSON.stringify(analysisSummary, null, 2));

    // 6. Save analysis to new log_analysis_results table
    console.log('💾 Saving to log_analysis_results table...');
    const analysisResult = await pool.query(
      `INSERT INTO log_analysis_results (log_id, total_analyzed, total_anomalies, analysis_status, analysis_summary)
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (log_id) 
       DO UPDATE SET 
         total_analyzed = EXCLUDED.total_analyzed,
         total_anomalies = EXCLUDED.total_anomalies,
         analysis_status = EXCLUDED.analysis_status,
         analysis_summary = EXCLUDED.analysis_summary,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [logId, logLines.length, anomalyCount, 'completed', analysisSummary]
    );
    console.log('✅ Saved to log_analysis_results table, ID:', analysisResult.rows[0].id);

    // 7. Also update the logs table with basic analysis result for backward compatibility
    console.log('💾 Updating logs table for backward compatibility...');
    await pool.query(
      'UPDATE logs SET analysis_result = $1 WHERE id = $2',
      [analysisSummary, logId]
    );
    console.log('✅ Updated logs table');

    const response = {
      status: 'success',
      total_anomalies: anomalyCount,
      total_analyzed: logLines.length,
      analysis_id: analysisResult.rows[0].id,
      message: `Analysis completed successfully. Found ${anomalyCount} anomalies in ${logLines.length} log entries.`
    };

    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    console.error('❌ Analyze log error:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// GET /api/logs/:id/analysis
router.get('/:id/analysis', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.userId;
    const logId = req.params.id;

    // First check if the log belongs to the user
    const logCheck = await pool.query(
      'SELECT id FROM logs WHERE id = $1 AND user_id = $2',
      [logId, userId]
    );
    if (logCheck.rows.length === 0) {
      res.status(404).json({ message: 'Log not found' });
      return;
    }

    // Get analysis results from the new table
    const result = await pool.query(
      `SELECT lar.*, l.original_filename, l.upload_date 
       FROM log_analysis_results lar
       JOIN logs l ON lar.log_id = l.id
       WHERE lar.log_id = $1`,
      [logId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Analysis not found' });
      return;
    }
    
    res.json({ 
      analysis: result.rows[0],
      status: 'success'
    });
  } catch (err) {
    console.error('Get analysis error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/logs/:id/anomalies - New endpoint for detailed anomaly data
router.get('/:id/anomalies', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.userId;
    const logId = req.params.id;

    // First check if the log belongs to the user
    const logCheck = await pool.query(
      'SELECT * FROM logs WHERE id = $1 AND user_id = $2',
      [logId, userId]
    );
    if (logCheck.rows.length === 0) {
      res.status(404).json({ message: 'Log not found' });
      return;
    }

    const filePath = logCheck.rows[0].file_path;
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    let logLines: LogLine[] = [];
    
    // Parse CSV (same logic as analyze endpoint)
    const firstLine = lines[0].trim();
    if (firstLine.startsWith('"') && firstLine.endsWith('"') && firstLine.includes(',')) {
      const headerContent = firstLine.slice(1, -1);
      const headers = headerContent.split(',').map(h => h.trim());
      const dataLines = lines.slice(1);
      
      for (const line of dataLines) {
        if (!line.trim()) continue;
        
        let cleanedLine = line.trim();
        if (cleanedLine.startsWith('"') && cleanedLine.endsWith('"')) {
          cleanedLine = cleanedLine.slice(1, -1);
        }
        
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let i = 0; i < cleanedLine.length; i++) {
          const char = cleanedLine[i];
          
          if (char === '"') {
            if (inQuotes && cleanedLine[i + 1] === '"') {
              currentValue += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        
        values.push(currentValue.trim());
        
        const logLine: any = {};
        headers.forEach((header, index) => {
          if (index < values.length) {
            let value = values[index];
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            logLine[header] = value;
          }
        });
        
        logLines.push(logLine);
      }
    } else {
      logLines = csvParse(fileContent, { 
        columns: true, 
        skip_empty_lines: true, 
        bom: true, 
        relax_quotes: true 
      });
    }

    // Run anomaly detection
    const anomalies = detectAnomalies(logLines);
    
    // Create detailed anomaly data (without individual AI analysis)
    console.log('📋 Creating anomaly details...');
    const anomalyDetails = [];
    
    for (let i = 0; i < logLines.length; i++) {
      const logLine = logLines[i];
      const anomaly = anomalies[i];
      
      if (anomaly) {
        anomalyDetails.push({
          logEntry: logLine,
          isAnomalous: true,
          anomalyDetails: {
            reason: anomaly.ruleReason,
            confidenceScore: anomaly.ruleConfidenceScore,
            confidenceLevel: anomaly.ruleConfidenceScore >= 85 ? 'High' : 
                            anomaly.ruleConfidenceScore >= 70 ? 'Medium' : 'Low',
            timestamp: logLine.timestamp || logLine.time || new Date().toISOString(),
            sourceIP: logLine.srcip || 'Unknown',
            destination: logLine.url || logLine.dstip || 'Unknown',
            action: logLine.action || 'Unknown',
            statusCode: logLine.status_code || 'Unknown'
          }
        });
      }
    }

    // Filter to only show anomalous entries
    const anomalousEntries = anomalyDetails.filter(entry => entry.isAnomalous);
    
    // Get summary statistics
    const anomalyStats = getAnomalyStats(anomalies);
    
    res.json({
      status: 'success',
      totalEntries: logLines.length,
      anomalousEntries: anomalousEntries.length,
      averageConfidence: anomalyStats.averageConfidence,
      highConfidenceAnomalies: anomalyStats.highConfidenceAnomalies,
      anomalyDetails: anomalousEntries,
      summary: {
        totalAnalyzed: logLines.length,
        totalAnomalies: anomalousEntries.length,
        anomalyPercentage: logLines.length > 0 ? (anomalousEntries.length / logLines.length * 100).toFixed(2) : 0,
        averageConfidence: anomalyStats.averageConfidence,
        anomalyTypes: anomalyStats.anomalyTypes
      }
    });
  } catch (err) {
    console.error('Get anomalies error:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Test Gemini API connection
router.get('/test-gemini', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const isConnected = await geminiService.testConnection();
    if (isConnected) {
      res.json({ 
        status: 'success', 
        message: 'Gemini API connection successful',
        geminiEnabled: true
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Gemini API connection failed',
        geminiEnabled: false
      });
    }
  } catch (error: any) {
    console.error('Gemini test error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      geminiEnabled: false
    });
  }
});

export default router; 